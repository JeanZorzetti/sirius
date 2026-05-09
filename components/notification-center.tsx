"use client";

import { useTranslations } from 'next-intl';
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

const notificationTypeLabels = {
  DEAL_CREATED: "Novo Negócio",
  DEAL_WON: "Negócio Ganho",
  DEAL_LOST: "Negócio Perdido",
  DEAL_STAGE_CHANGED: "Mudança de Estágio",
  WHATSAPP_MESSAGE: "Mensagem WhatsApp",
  CALENDAR_REMINDER: "Lembrete",
  MENTION: "Menção",
  SYSTEM: "Sistema",
};

const notificationTypeColors = {
  DEAL_CREATED: "bg-blue-500/10 text-blue-500",
  DEAL_WON: "bg-green-500/10 text-green-500",
  DEAL_LOST: "bg-red-500/10 text-red-500",
  DEAL_STAGE_CHANGED: "bg-purple-500/10 text-purple-500",
  WHATSAPP_MESSAGE: "bg-green-600/10 text-green-600",
  CALENDAR_REMINDER: "bg-orange-500/10 text-orange-500",
  MENTION: "bg-yellow-500/10 text-yellow-500",
  SYSTEM: "bg-gray-500/10 text-gray-500",
};

export function NotificationCenter() {
  const tCommon = useTranslations('common');
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{tCommon('common.notifications')}</h3>
            {!isConnected && (
              <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" title="Desconectado" />
            )}
            {isConnected && (
              <div className="h-2 w-2 rounded-full bg-green-500" title="Conectado" />
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todas como lida
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-muted-foreground">{tCommon('buttons.loading')}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Bell className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const NotificationContent = (
                  <div
                    className={`flex gap-3 p-4 hover:bg-muted/50 transition-colors ${
                      !notification.read ? "bg-purple-50/30 dark:bg-purple-950/20" : ""
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${notificationTypeColors[notification.type]}`}
                          >
                            {notificationTypeLabels[notification.type]}
                          </Badge>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="text-sm font-medium">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                );

                if (notification.actionUrl) {
                  return (
                    <Link
                      key={notification.id}
                      href={notification.actionUrl}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      {NotificationContent}
                    </Link>
                  );
                }

                return (
                  <div key={notification.id}>
                    {NotificationContent}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
