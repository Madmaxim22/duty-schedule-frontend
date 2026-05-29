import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { getAccessToken } from '@/shared/api/client';
import { getChatWsUrl, markChatRoomRead } from '@/shared/api/chat';
import type { ChatMessage, ChatRoomListItem } from '@/shared/api/types';
import { useAuth } from '@/features/auth/AuthContext';
import { captureChatReactionScroll } from './chatReactionScrollAnchor';
import { deferChatReactionReveal } from './chatReactionRevealHold';
import {
  appendMessageToChatPages,
  markMessagesReadByPeer,
  removeMessageFromChatPages,
  updateMessageInChatPagesWithReplyQuotes,
  updateMessageReactions,
  updateSingleMessageStatus,
  type ChatMessagesPage,
} from './chatMessagesCache';

type ServerMessage =
  | { type: 'auth.ok'; userId: string }
  | { type: 'message.new'; roomId: string; message: ChatMessage }
  | { type: 'message.updated'; roomId: string; message: ChatMessage }
  | { type: 'message.hidden'; roomId: string; messageId: string }
  | { type: 'message.status'; roomId: string; messageId: string; status: 'delivered' | 'read' }
  | {
      type: 'message.reaction';
      roomId: string;
      messageId: string;
      reactions: ChatMessage['reactions'];
    }
  | { type: 'read.updated'; roomId: string; userId: string; lastReadAt: string }
  | { type: 'room.updated'; room: ChatRoomListItem }
  | { type: 'typing'; roomId: string; userId: string; active: boolean }
  | { type: 'error'; code: string; message: string };

const TYPING_EXPIRE_MS = 5000;

type ChatSocketContextValue = {
  connected: boolean;
  subscribe: (roomIds: string[]) => void;
  unsubscribe: (roomIds: string[]) => void;
  sendTyping: (roomId: string, active: boolean) => void;
  getTypingUserIds: (roomId: string) => string[];
};

const ChatSocketContext = createContext<ChatSocketContextValue | null>(null);

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

function syncChatUnreadTotalFromRooms(queryClient: QueryClient) {
  const data = queryClient.getQueryData<{ rooms: ChatRoomListItem[] }>(['chat', 'rooms']);
  if (!data) {
    void queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
    return;
  }
  const count = data.rooms.reduce((sum, r) => sum + r.unreadCount, 0);
  queryClient.setQueryData(['chat', 'unread-count'], { count });
}

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const subscribedRef = useRef<Set<string>>(new Set());
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimersRef = useRef<Map<string, Map<string, ReturnType<typeof setTimeout>>>>(new Map());
  const [connected, setConnected] = useState(false);
  const [typingByRoom, setTypingByRoom] = useState<Record<string, string[]>>({});

  const send = useCallback((payload: object) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, []);

  const flushSubscribe = useCallback(() => {
    const ids = [...subscribedRef.current];
    if (ids.length > 0) {
      send({ type: 'subscribe', roomIds: ids });
    }
  }, [send]);

  const subscribe = useCallback(
    (roomIds: string[]) => {
      for (const id of roomIds) {
        subscribedRef.current.add(id);
      }
      send({ type: 'subscribe', roomIds });
    },
    [send],
  );

  const unsubscribe = useCallback(
    (roomIds: string[]) => {
      for (const id of roomIds) {
        subscribedRef.current.delete(id);
      }
      send({ type: 'unsubscribe', roomIds });
    },
    [send],
  );

  const sendTyping = useCallback(
    (roomId: string, active: boolean) => {
      send({ type: 'typing', roomId, active });
    },
    [send],
  );

  const clearTypingUser = useCallback((roomId: string, userId: string) => {
    const roomTimers = typingTimersRef.current.get(roomId);
    const timer = roomTimers?.get(userId);
    if (timer) {
      clearTimeout(timer);
      roomTimers?.delete(userId);
    }
    setTypingByRoom((prev) => {
      const ids = prev[roomId];
      if (!ids?.includes(userId)) return prev;
      const nextIds = ids.filter((id) => id !== userId);
      if (nextIds.length === 0) {
        const { [roomId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [roomId]: nextIds };
    });
  }, []);

  const setTypingUser = useCallback(
    (roomId: string, userId: string, active: boolean) => {
      if (userId === user?.id) return;

      if (!active) {
        clearTypingUser(roomId, userId);
        return;
      }

      let roomTimers = typingTimersRef.current.get(roomId);
      if (!roomTimers) {
        roomTimers = new Map();
        typingTimersRef.current.set(roomId, roomTimers);
      }

      const existing = roomTimers.get(userId);
      if (existing) clearTimeout(existing);

      roomTimers.set(
        userId,
        setTimeout(() => {
          clearTypingUser(roomId, userId);
        }, TYPING_EXPIRE_MS),
      );

      setTypingByRoom((prev) => {
        const ids = prev[roomId] ?? [];
        if (ids.includes(userId)) return prev;
        return { ...prev, [roomId]: [...ids, userId] };
      });
    },
    [user?.id, clearTypingUser],
  );

  const getTypingUserIds = useCallback(
    (roomId: string) => typingByRoom[roomId] ?? [],
    [typingByRoom],
  );

  const handleServerMessage = useCallback(
    (msg: ServerMessage) => {
      if (msg.type === 'auth.ok') {
        setConnected(true);
        reconnectAttemptRef.current = 0;
        flushSubscribe();
        return;
      }

      if (msg.type === 'message.new') {
        clearTypingUser(msg.roomId, msg.message.author.id);
        queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(
          ['chat', 'messages', msg.roomId],
          (old) => appendMessageToChatPages(old, msg.message) ?? old,
        );

        const isViewingRoom = subscribedRef.current.has(msg.roomId);
        const isIncoming = msg.message.author.id !== user?.id;
        if (isIncoming) {
          send({ type: 'message.delivered', roomId: msg.roomId, messageId: msg.message.id });
        }

        if (isViewingRoom && isIncoming) {
          void markChatRoomRead(msg.roomId).then(() => {
            queryClient.setQueryData<{ rooms: ChatRoomListItem[] }>(['chat', 'rooms'], (old) => {
              if (!old) return old;
              return {
                rooms: old.rooms.map((r) =>
                  r.id === msg.roomId ? { ...r, unreadCount: 0 } : r,
                ),
              };
            });
            queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
          });
        }
        // Список и счётчик непрочитанных обновляет room.updated (приходит сразу после отправки).
        return;
      }

      if (msg.type === 'message.updated') {
        queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(
          ['chat', 'messages', msg.roomId],
          (old) => updateMessageInChatPagesWithReplyQuotes(old, msg.message) ?? old,
        );
        return;
      }

      if (msg.type === 'message.hidden') {
        queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(
          ['chat', 'messages', msg.roomId],
          (old) => removeMessageFromChatPages(old, msg.messageId) ?? old,
        );
        return;
      }

      if (msg.type === 'message.status') {
        queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(
          ['chat', 'messages', msg.roomId],
          (old) => updateSingleMessageStatus(old, msg.messageId, msg.status) ?? old,
        );
        return;
      }

      if (msg.type === 'message.reaction') {
        captureChatReactionScroll(msg.roomId);
        if (!deferChatReactionReveal(msg.messageId, msg.reactions)) {
          queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(
            ['chat', 'messages', msg.roomId],
            (old) => updateMessageReactions(old, msg.messageId, msg.reactions) ?? old,
          );
        }
        return;
      }

      if (msg.type === 'read.updated') {
        if (msg.userId === user?.id) return;
        if (!user?.id) return;
        queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(
          ['chat', 'messages', msg.roomId],
          (old) => markMessagesReadByPeer(old, user.id, msg.lastReadAt) ?? old,
        );
        return;
      }

      if (msg.type === 'room.updated') {
        const room =
          subscribedRef.current.has(msg.room.id) ? { ...msg.room, unreadCount: 0 } : msg.room;
        queryClient.setQueryData<{ rooms: ChatRoomListItem[] }>(
          ['chat', 'rooms'],
          (old) => {
            if (!old) return { rooms: [room] };
            const idx = old.rooms.findIndex((r) => r.id === room.id);
            const rooms =
              idx === -1
                ? [room, ...old.rooms]
                : old.rooms.map((r, i) => (i === idx ? room : r));
            return {
              rooms: [...rooms].sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
              ),
            };
          },
        );
        if (!subscribedRef.current.has(msg.room.id)) {
          syncChatUnreadTotalFromRooms(queryClient);
        }
        return;
      }

      if (msg.type === 'typing') {
        setTypingUser(msg.roomId, msg.userId, msg.active);
      }
    },
    [queryClient, flushSubscribe, setTypingUser, clearTypingUser, send, user?.id],
  );

  useEffect(() => {
    if (!user) {
      setConnected(false);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    let cancelled = false;

    function scheduleReconnect() {
      if (cancelled) return;
      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** reconnectAttemptRef.current,
        RECONNECT_MAX_MS,
      );
      reconnectAttemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    }

    function disconnectSocket(ws: WebSocket | null) {
      if (!ws) return;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'client_disconnect');
      }
      // CONNECTING: не вызываать close() — иначе браузер: "closed before established"
    }

    function connect() {
      if (cancelled) return;
      const token = getAccessToken();
      if (!token) return;

      disconnectSocket(wsRef.current);
      const ws = new WebSocket(getChatWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled || wsRef.current !== ws) return;
        ws.send(JSON.stringify({ type: 'auth', token }));
      };

      ws.onmessage = (ev) => {
        if (wsRef.current !== ws) return;
        try {
          const parsed = JSON.parse(ev.data as string) as ServerMessage;
          handleServerMessage(parsed);
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        setConnected(false);
        if (cancelled) return;
        scheduleReconnect();
      };

      ws.onerror = () => {
        if (wsRef.current === ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      setConnected(false);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      const ws = wsRef.current;
      wsRef.current = null;
      disconnectSocket(ws);
    };
  }, [user?.id, handleServerMessage]);

  return (
    <ChatSocketContext.Provider
      value={{ connected, subscribe, unsubscribe, sendTyping, getTypingUserIds }}
    >
      {children}
    </ChatSocketContext.Provider>
  );
}

export function useChatSocket() {
  const ctx = useContext(ChatSocketContext);
  if (!ctx) {
    throw new Error('useChatSocket must be used within ChatSocketProvider');
  }
  return ctx;
}
