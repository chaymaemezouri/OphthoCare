'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { messagingApi, type ChatMessage, type ConversationRow } from '@/lib/api/messaging';
import { useAuth } from '@/hooks/use-auth';
import { getSession } from 'next-auth/react';

async function readToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const fromStorage = sessionStorage.getItem('access_token');
  if (fromStorage) return fromStorage;
  const session = await getSession();
  return session?.accessToken ?? null;
}

export function useMessaging() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const data = await messagingApi.listConversations();
      setConversations(data.items);
      setUnreadCount(data.unreadTotal);
    } catch {
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const data = await messagingApi.getMessages(conversationId);
      setMessages(data.items);
      const unread = data.items.filter((m) => !m.readAt && m.senderId !== user?.id);
      for (const m of unread) {
        void messagingApi.markRead(m.id);
      }
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || user.role === 'trainee' || user.role === 'admin') return;
    let cancelled = false;
    let socket: Socket | null = null;

    void readToken().then((token) => {
      if (cancelled || !token) return;

      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      socket = io(`${base}/chat`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
      });
      socketRef.current = socket;

      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));

      socket.on('unreadCount', (p: { total?: number }) => {
        if (typeof p?.total === 'number') setUnreadCount(p.total);
      });

      socket.on('newMessage', (msg: ChatMessage) => {
        setConversations((prev) => {
          const next = [...prev];
          const idx = next.findIndex((c) => c.id === msg.conversationId);
          if (idx >= 0) {
            next[idx] = {
              ...next[idx],
              lastMessageAt: msg.createdAt,
              lastMessagePreview: msg.content.slice(0, 120),
              unreadCount:
                msg.senderId === user?.id ? next[idx].unreadCount : next[idx].unreadCount + 1,
            };
            const [row] = next.splice(idx, 1);
            next.unshift(row);
          }
          return next;
        });
        setMessages((prev) => {
          if (msg.conversationId !== activeConversationId) return prev;
          if (prev.some((m) => m.id === msg.id)) return prev;
          if (msg.senderId !== user?.id) void messagingApi.markRead(msg.id);
          return [...prev, msg];
        });
        if (msg.senderId !== user?.id) {
          void messagingApi.unreadTotal().then((r) => setUnreadCount(r.total));
        }
      });

      socket.on('typingStatus', (p: { userId?: string; isTyping?: boolean }) => {
        if (p.isTyping && p.userId && p.userId !== user?.id) setTypingUserId(p.userId);
        else setTypingUserId(null);
      });

      socket.on('messageReadAck', () => {
        void loadConversations();
      });

      void loadConversations();
    });

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user?.id, user?.role, loadConversations, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    void loadMessages(activeConversationId);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c)),
    );
  }, [activeConversationId, loadMessages]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!activeConversationId || !content.trim()) return;
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('sendMessage', { conversationId: activeConversationId, content: content.trim() });
      }
    },
    [activeConversationId],
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConversationId) return;
      socketRef.current?.emit('typing', { conversationId: activeConversationId, isTyping });
    },
    [activeConversationId],
  );

  const markRead = useCallback((messageId: string) => {
    socketRef.current?.emit('markRead', { messageId });
  }, []);

  return {
    connected,
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    unreadCount,
    typingUserId,
    loadingConversations,
    loadingMessages,
    loadConversations,
    sendMessage,
    sendTyping,
    markRead,
    currentUserId: user?.id,
  };
}
