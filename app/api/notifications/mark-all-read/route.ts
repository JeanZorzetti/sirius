import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { apiError } from "@/lib/api-error";
import { ERR } from "@/lib/error-messages";

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request });
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

    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request });
  }
}
