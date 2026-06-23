import apiClient from './client';

export type ConversationRow = {
  id: string;
  patientId: string;
  doctorSpaceId: string;
  doctorSpaceName: string;
  patientName: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  senderName: string;
};

export const messagingApi = {
  unreadTotal: async () => {
    const res = await apiClient.get('/messaging/unread-total');
    return res.data as { total: number };
  },

  listConversations: async () => {
    const res = await apiClient.get('/messaging/conversations');
    return res.data as { unreadTotal: number; items: ConversationRow[] };
  },

  eligibleSpaces: async () => {
    const res = await apiClient.get('/messaging/eligible-spaces');
    return res.data as { items: { doctorSpaceId: string; name: string }[] };
  },

  createConversation: async (doctorSpaceId: string) => {
    const res = await apiClient.post('/messaging/conversations', { doctorSpaceId });
    return res.data as { id: string };
  },

  getMessages: async (conversationId: string, cursor?: string, limit = 30) => {
    const res = await apiClient.get(`/messaging/conversations/${encodeURIComponent(conversationId)}/messages`, {
      params: { cursor, limit },
    });
    return res.data as { items: ChatMessage[]; nextCursor: string | null };
  },

  markRead: async (messageId: string) => {
    const res = await apiClient.patch(`/messaging/messages/${encodeURIComponent(messageId)}/read`);
    return res.data;
  },

  broadcast: async (body: {
    subject: string;
    content: string;
    recipientFilter: 'ALL' | 'ACTIVE_LAST_30D' | 'CHRONIC';
  }) => {
    const res = await apiClient.post('/messaging/broadcast', body);
    return res.data as { id: string; recipientCount: number };
  },
};
