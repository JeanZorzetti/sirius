import { getSession } from "@/lib/auth";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

/**
 * Server-Sent Events (SSE) endpoint for real-time notifications
 *
 * Usage:
 * const eventSource = new EventSource('/api/notifications/stream');
 * eventSource.onmessage = (event) => {
 *   const notification = JSON.parse(event.data);
 *   console.log(notification);
 * };
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    logger.info({
      msg: "SSE connection established",
      userId,
    });

    // Create readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "connected",
              message: "Connected to notification stream",
            })}\n\n`
          )
        );

        // Poll for new notifications every 5 seconds
        const interval = setInterval(async () => {
          try {
            // Fetch unread notifications
            const notifications = await prisma.notification.findMany({
              where: {
                userId,
                read: false,
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 10,
            });

            // Send notifications to client
            if (notifications.length > 0) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "notifications",
                    data: notifications,
                  })}\n\n`
                )
              );
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
              msg: "Error fetching notifications in SSE stream",
              error: error instanceof Error ? error.message : "Unknown error",
              userId,
            });
          }
        }, 5000); // Poll every 5 seconds

        // Cleanup on connection close
        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
          logger.info({
            msg: "SSE connection closed",
            userId,
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
      msg: "Error in SSE endpoint",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}
