import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    logger.info({
      msg: "All notifications marked as read",
      count: result.count,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      count: result.count,
    });
  } catch (error) {
    logger.error({
      msg: "Error marking all notifications as read",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Erro ao marcar notificações como lidas" },
      { status: 500 }
    );
  }
}
