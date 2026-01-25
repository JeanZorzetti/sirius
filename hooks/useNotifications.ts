"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface Notification {
  id: string;
  type:
    | "DEAL_CREATED"
    | "DEAL_WON"
    | "DEAL_LOST"
    | "DEAL_STAGE_CHANGED"
    | "WHATSAPP_MESSAGE"
    | "CALENDAR_REMINDER"
    | "MENTION"
    | "SYSTEM";
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  actionUrl: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing real-time notifications via Server-Sent Events (SSE)
 *
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead } = useNotifications();
 *
 * return (
 *   <div>
 *     <p>Unread: {unreadCount}</p>
 *     {notifications.map((notif) => (
 *       <div key={notif.id} onClick={() => markAsRead(notif.id)}>
 *         {notif.title}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error("Failed to fetch notifications");

      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });

      if (!response.ok) throw new Error("Failed to mark notification as read");

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete notification");

      // Update local state
      setNotifications((prev) => {
        const deleted = prev.find((n) => n.id === id);
        if (deleted && !deleted.read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  // Setup SSE connection for real-time updates
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Setup SSE
    const eventSource = new EventSource("/api/notifications/stream");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("SSE connection established");
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          console.log("Connected to notification stream");
        } else if (data.type === "notifications" && data.data) {
          // Merge new notifications with existing ones
          setNotifications((prev) => {
            const newNotifs = data.data.filter(
              (newNotif: Notification) => !prev.some((n) => n.id === newNotif.id)
            );
            return [...newNotifs, ...prev];
          });
          setUnreadCount(data.data.length);
        } else if (data.type === "heartbeat") {
          // Keep-alive heartbeat
          console.debug("Heartbeat received");
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
