import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: params,
    });

    logger.info({
      msg: "Notification created",
      notificationId: notification.id,
      type: params.type,
      userId: params.userId,
    });

    return notification;
  } catch (error) {
    logger.error({
      msg: "Error creating notification",
      error: error instanceof Error ? error.message : "Unknown error",
      params,
    });
    throw error;
  }
}

/**
 * Create notifications for multiple users
 */
export async function createNotifications(
  notifications: CreateNotificationParams[]
) {
  try {
    const result = await prisma.notification.createMany({
      data: notifications,
    });

    logger.info({
      msg: "Bulk notifications created",
      count: result.count,
    });

    return result;
  } catch (error) {
    logger.error({
      msg: "Error creating bulk notifications",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Notify user about a new deal
 */
export async function notifyDealCreated({
  dealId,
  dealTitle,
  userId,
  organizationId,
  creatorName,
}: {
  dealId: string;
  dealTitle: string;
  userId: string;
  organizationId: string;
  creatorName: string;
}) {
  return createNotification({
    userId,
    organizationId,
    type: "DEAL_CREATED",
    title: "Novo negócio criado",
    message: `${creatorName} criou um novo negócio: ${dealTitle}`,
    actionUrl: `/dashboard/deals/${dealId}`,
    metadata: { dealId, creatorName },
  });
}

/**
 * Notify user about a deal stage change
 */
export async function notifyDealStageChanged({
  dealId,
  dealTitle,
  userId,
  organizationId,
  oldStage,
  newStage,
  changerName,
}: {
  dealId: string;
  dealTitle: string;
  userId: string;
  organizationId: string;
  oldStage: string;
  newStage: string;
  changerName: string;
}) {
  return createNotification({
    userId,
    organizationId,
    type: "DEAL_STAGE_CHANGED",
    title: "Negócio movido",
    message: `${changerName} moveu "${dealTitle}" de ${oldStage} para ${newStage}`,
    actionUrl: `/dashboard/deals/${dealId}`,
    metadata: { dealId, oldStage, newStage, changerName },
  });
}

/**
 * Notify user about a won deal
 */
export async function notifyDealWon({
  dealId,
  dealTitle,
  userId,
  organizationId,
  value,
}: {
  dealId: string;
  dealTitle: string;
  userId: string;
  organizationId: string;
  value?: number;
}) {
  return createNotification({
    userId,
    organizationId,
    type: "DEAL_WON",
    title: "🎉 Negócio ganho!",
    message: `Parabéns! "${dealTitle}" foi conquistado${value ? ` (R$ ${value.toLocaleString("pt-BR")})` : ""}`,
    actionUrl: `/dashboard/deals/${dealId}`,
    metadata: { dealId, value },
  });
}

/**
 * Notify user about a lost deal
 */
export async function notifyDealLost({
  dealId,
  dealTitle,
  userId,
  organizationId,
}: {
  dealId: string;
  dealTitle: string;
  userId: string;
  organizationId: string;
}) {
  return createNotification({
    userId,
    organizationId,
    type: "DEAL_LOST",
    title: "Negócio perdido",
    message: `"${dealTitle}" foi marcado como perdido`,
    actionUrl: `/dashboard/deals/${dealId}`,
    metadata: { dealId },
  });
}

/**
 * Notify user about a new WhatsApp message
 */
export async function notifyWhatsAppMessage({
  messageId,
  contactName,
  messagePreview,
  userId,
  organizationId,
  dealId,
}: {
  messageId: string;
  contactName: string;
  messagePreview: string;
  userId: string;
  organizationId: string;
  dealId?: string;
}) {
  return createNotification({
    userId,
    organizationId,
    type: "WHATSAPP_MESSAGE",
    title: `Nova mensagem de ${contactName}`,
    message: messagePreview.slice(0, 100),
    actionUrl: dealId ? `/dashboard/deals/${dealId}` : "/dashboard/whatsapp",
    metadata: { messageId, contactName, dealId },
  });
}

/**
 * Notify user about an upcoming calendar event
 */
export async function notifyCalendarReminder({
  eventId,
  eventTitle,
  eventTime,
  userId,
  organizationId,
  dealId,
}: {
  eventId: string;
  eventTitle: string;
  eventTime: Date;
  userId: string;
  organizationId: string;
  dealId?: string;
}) {
  return createNotification({
    userId,
    organizationId,
    type: "CALENDAR_REMINDER",
    title: "Lembrete de reunião",
    message: `"${eventTitle}" começa em breve`,
    actionUrl: dealId ? `/dashboard/deals/${dealId}` : "/dashboard/calendar",
    metadata: { eventId, eventTime: eventTime.toISOString(), dealId },
  });
}

/**
 * Notify user about being mentioned
 */
export async function notifyMention({
  mentionedByName,
  context,
  userId,
  organizationId,
  actionUrl,
}: {
  mentionedByName: string;
  context: string;
  userId: string;
  organizationId: string;
  actionUrl: string;
}) {
  return createNotification({
    userId,
    organizationId,
    type: "MENTION",
    title: "Você foi mencionado",
    message: `${mentionedByName} mencionou você: ${context.slice(0, 100)}`,
    actionUrl,
    metadata: { mentionedByName },
  });
}

/**
 * Send system notification to user
 */
export async function notifySystem({
  title,
  message,
  userId,
  organizationId,
  actionUrl,
}: {
  title: string;
  message: string;
  userId: string;
  organizationId: string;
  actionUrl?: string;
}) {
  return createNotification({
    userId,
    organizationId,
    type: "SYSTEM",
    title,
    message,
    actionUrl,
  });
}

/**
 * Notify all users in an organization
 */
export async function notifyOrganization({
  organizationId,
  type,
  title,
  message,
  actionUrl,
  metadata,
}: {
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}) {
  try {
    // Get all users in the organization
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: { id: true },
    });

    const notifications = users.map((user) => ({
      userId: user.id,
      organizationId,
      type,
      title,
      message,
      actionUrl,
      metadata,
    }));

    return createNotifications(notifications);
  } catch (error) {
    logger.error({
      msg: "Error notifying organization",
      error: error instanceof Error ? error.message : "Unknown error",
      organizationId,
    });
    throw error;
  }
}
