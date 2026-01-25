import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

/**
 * PATCH /api/notifications/[id]
 * Mark notification as read/unread
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { read } = body;

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      );
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
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

    return NextResponse.json(
      { error: "Erro ao atualizar notificação" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = params;

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      );
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
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

    return NextResponse.json(
      { error: "Erro ao deletar notificação" },
      { status: 500 }
    );
  }
}
