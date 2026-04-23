import axiosInstance from "../lib/axios";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export const notificationService = {
  getNotifications: async () => {
    const response = await axiosInstance.get<{ data: Notification[] }>("/api/notifications");
    return response.data.data;
  },
  getUnreadCount: async () => {
    const response = await axiosInstance.get<{ unread_count: number }>("/api/notifications/unread-count");
    return response.data.unread_count;
  },
  markAsRead: async (id: string) => {
    await axiosInstance.post(`/api/notifications/${id}/read`);
  },
  markAllAsRead: async () => {
    await axiosInstance.post("/api/notifications/read-all");
  },
};
