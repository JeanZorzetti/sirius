import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { apiError } from "@/lib/api-error";
import { ERR } from "@/lib/error-messages";

/**
 * PATCH /api/notifications/[id]
 * Mark notification as read/unread
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request });
    }

    const { id } = await params;
    const body = await request.json();
    const { read } = body;

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return await apiError(ERR.NOT_FOUND, 404, { req: request });
    }

    if (notification.userId !== session.user.id) {
      return await apiError(ERR.FORBIDDEN, 403, { req: request });
    }

    // Update notification
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        read,
        readAt: read ? new Date() : null,
      },
    });

    logger.info({
      msg: "Notification updated",
      notificationId: id,
      read,
      userId: session.user.id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error({
      msg: "Error updating notification",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request });
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request });
    }

    const { id } = await params;

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return await apiError(ERR.NOT_FOUND, 404, { req: request });
    }

    if (notification.userId !== session.user.id) {
      return await apiError(ERR.FORBIDDEN, 403, { req: request });
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id },
    });

    logger.info({
      msg: "Notification deleted",
      notificationId: id,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({
      msg: "Error deleting notification",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request });
  }
}
