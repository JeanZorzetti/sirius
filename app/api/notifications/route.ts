import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { z } from "zod";
import { apiError } from "@/lib/api-error";
import { ERR } from "@/lib/error-messages";

const createNotificationSchema = z.object({
  type: z.enum([
    "DEAL_CREATED",
    "DEAL_WON",
    "DEAL_LOST",
    "DEAL_STAGE_CHANGED",
    "WHATSAPP_MESSAGE",
    "CALENDAR_REMINDER",
    "MENTION",
    "SYSTEM",
  ]),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  actionUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * GET /api/notifications
 * List all notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly && { read: false }),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    logger.error({
      msg: "Error fetching notifications",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request });
  }
}

/**
 * POST /api/notifications
 * Create a new notification (internal use or webhooks)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request });
    }

    const body = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    const notification = await prisma.notification.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        organizationId: session.user.organizationId,
      },
    });

    logger.info({
      msg: "Notification created",
      notificationId: notification.id,
      userId: session.user.id,
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    logger.error({
      msg: "Error creating notification",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request });
  }
}
