import { getSession } from "@/lib/auth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { chatEvents } from "@/lib/chat-events";

/**
 * Server-Sent Events (SSE) endpoint for real-time WhatsApp messages
 *
 * This endpoint provides real-time updates for:
 * - New messages (inbound/outbound)
 * - Message status changes (sent/delivered/read)
 * - Conversation updates (assignment, status)
 *
 * Usage:
 * const eventSource = new EventSource('/api/whatsapp/stream');
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log(data.type, data);
 * };
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return new Response("Organization not found", { status: 404 });
    }

    const organizationId = user.organizationId;

    logger.info({
      msg: "WhatsApp SSE connection established",
      organizationId,
      userId: session.user.id,
    });

    // Track last message timestamps to detect new messages
    const lastMessageTimestamps = new Map<string, Date>();

    // Create readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "connected",
              message: "Connected to WhatsApp stream",
              timestamp: new Date().toISOString(),
            })}\n\n`
          )
        );

        // Listen for events from chatEvents EventEmitter
        const eventHandler = (event: any) => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          } catch (error) {
            logger.error({
              msg: "Error sending event to SSE client",
              error: error instanceof Error ? error.message : "Unknown error",
              organizationId,
            });
          }
        };

        // Subscribe to chat events for this organization
        chatEvents.on(`message:${organizationId}`, eventHandler);

        // Poll database for new messages every 2 seconds (fallback if webhook misses)
        const pollInterval = setInterval(async () => {
          try {
            // Get all contacts with messages
            const contacts = await prisma.contact.findMany({
              where: {
                organizationId,
                whatsappMessages: {
                  some: {}
                }
              },
              include: {
                whatsappMessages: {
                  orderBy: { sentAt: 'desc' },
                  take: 1,
                },
                chatConversation: {
                  include: {
                    assignedUser: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      }
                    }
                  }
                },
                _count: {
                  select: {
                    whatsappMessages: true,
                  }
                }
              },
            });

            // Check for new messages
            for (const contact of contacts) {
              const lastMessage = contact.whatsappMessages[0];
              if (!lastMessage) continue;

              const lastTimestamp = lastMessageTimestamps.get(contact.id);
              const currentTimestamp = new Date(lastMessage.sentAt);

              // If this is a new message (or first time seeing this contact)
              if (!lastTimestamp || currentTimestamp > lastTimestamp) {
                lastMessageTimestamps.set(contact.id, currentTimestamp);

                // Only notify if not first time (avoid sending all messages on connect)
                if (lastTimestamp) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "conversation.updated",
                        contactId: contact.id,
                        contact: {
                          id: contact.id,
                          name: contact.name,
                          phone: contact.phone,
                          lastMessage: lastMessage,
                          chatConversation: contact.chatConversation,
                          _count: contact._count,
                        },
                      })}\n\n`
                    )
                  );
                }
              }
            }

            // Send heartbeat to keep connection alive
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "heartbeat",
                  timestamp: new Date().toISOString(),
                })}\n\n`
              )
            );
          } catch (error) {
            logger.error({
              msg: "Error polling messages in SSE stream",
              error: error instanceof Error ? error.message : "Unknown error",
              organizationId,
            });
          }
        }, 2000); // Poll every 2 seconds

        // Cleanup on connection close
        request.signal.addEventListener("abort", () => {
          clearInterval(pollInterval);
          chatEvents.off(`message:${organizationId}`, eventHandler);
          controller.close();
          logger.info({
            msg: "WhatsApp SSE connection closed",
            organizationId,
            userId: session.user.id,
          });
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    logger.error({
      msg: "Error in WhatsApp SSE endpoint",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}
