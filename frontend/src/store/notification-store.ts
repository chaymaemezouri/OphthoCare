import { create } from 'zustand';

interface NotificationState {
  unread: number;
  setUnread: (n: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unread: 0,
  setUnread: (n) => set({ unread: n }),
}));
