import { BaseService } from './baseService';
import { client } from '@/utils/orpc';
import type { Notification } from '@/types/notifications';

export class NotificationService extends BaseService {
  /**
   * Get notifications list
   */
  async getNotifications(filters?: {
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<Notification[]> {
    return this.handleRequest(async () => {
      // Short timeout with demo fallback
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 1200);
      });

      try {
        const response = await Promise.race([
          (client as any).notifications.list(filters || {}),
          timeoutPromise,
        ]);
        return (response as any[]).map(notif => ({
          ...notif,
          timestamp: new Date(notif.timestamp),
        })) as Notification[];
      } catch {
        // Demo fallback - return empty array (notifications disabled)
        return [] as Notification[];
      }
    });
  }

  /**
   * Mark notification as read
   */
  async markRead(id: string): Promise<void> {
    return this.handleRequest(async () => {
      await (client as any).notifications.markRead({ id });
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllRead(): Promise<void> {
    return this.handleRequest(async () => {
      await (client as any).notifications.markAllRead();
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string): Promise<void> {
    return this.handleRequest(async () => {
      await (client as any).notifications.delete({ id });
    });
  }

  /**
   * Create notification (for testing/admin)
   */
  async createNotification(notification: Omit<Notification, 'id' | 'timestamp'>): Promise<Notification> {
    return this.handleRequest(async () => {
      const response = await (client as any).notifications.create(notification);
      return {
        ...response,
        timestamp: new Date(response.timestamp),
      } as Notification;
    });
  }
}

export const notificationService = new NotificationService();

