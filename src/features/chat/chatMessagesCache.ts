import type { InfiniteData } from '@tanstack/react-query';
import type { ChatMessage, ChatReactionSummary } from '@/shared/api/types';
import { replyQuoteBodyFromMessage } from './chatReplyQuote';

/** Одна страница ответа GET /chat/rooms/:id/messages (для useInfiniteQuery). */
export type ChatMessagesPage = {
  messages: ChatMessage[];
  nextBefore: string | null;
};

/** Склеить страницы в хронологический порядок (сверху старые). */
export function mergeChatPages(
  data: InfiniteData<ChatMessagesPage> | undefined,
): ChatMessage[] {
  if (!data?.pages.length) return [];
  return [...data.pages].reverse().flatMap((p) => p.messages);
}

/** Добавить новое сообщение в конец самой «свежей» страницы (первая в pages). */
export function appendMessageToChatPages(
  old: InfiniteData<ChatMessagesPage> | undefined,
  message: ChatMessage,
): InfiniteData<ChatMessagesPage> | undefined {
  if (!old?.pages.length) return old;
  const page0 = old.pages[0];
  if (page0.messages.some((m) => m.id === message.id)) return old;
  return {
    pageParams: old.pageParams,
    pages: [{ ...page0, messages: [...page0.messages, message] }, ...old.pages.slice(1)],
  };
}

const emptyInfiniteMessages = (): InfiniteData<ChatMessagesPage> => ({
  pages: [{ messages: [], nextBefore: null }],
  pageParams: [undefined],
});

/** Для optimistic update после POST: создать кэш, если запрос ещё не успел положить данные. */
export function appendMessageToChatPagesAfterPost(
  old: InfiniteData<ChatMessagesPage> | undefined,
  message: ChatMessage,
): InfiniteData<ChatMessagesPage> {
  const base = old?.pages.length ? old : emptyInfiniteMessages();
  return appendMessageToChatPages(base, message)!;
}

function mapPages(
  old: InfiniteData<ChatMessagesPage> | undefined,
  updater: (message: ChatMessage) => ChatMessage,
): InfiniteData<ChatMessagesPage> | undefined {
  if (!old?.pages.length) return old;
  return {
    pageParams: old.pageParams,
    pages: old.pages.map((page) => ({
      ...page,
      messages: page.messages.map(updater),
    })),
  };
}

export function updateSingleMessageStatus(
  old: InfiniteData<ChatMessagesPage> | undefined,
  messageId: string,
  status: 'delivered' | 'read',
): InfiniteData<ChatMessagesPage> | undefined {
  return mapPages(old, (message) => {
    if (message.id !== messageId || !message.status) return message;
    if (status === 'read') return { ...message, status: 'read' };
    if (message.status === 'read') return message;
    return { ...message, status: 'delivered' };
  });
}

export function updateMessageReactions(
  old: InfiniteData<ChatMessagesPage> | undefined,
  messageId: string,
  reactions: ChatReactionSummary[],
): InfiniteData<ChatMessagesPage> | undefined {
  return mapPages(old, (message) =>
    message.id === messageId ? { ...message, reactions } : message,
  );
}

export function markMessagesReadByPeer(
  old: InfiniteData<ChatMessagesPage> | undefined,
  myUserId: string,
  lastReadAt: string,
): InfiniteData<ChatMessagesPage> | undefined {
  const lastReadMs = new Date(lastReadAt).getTime();
  if (!Number.isFinite(lastReadMs)) return old;
  return mapPages(old, (message) => {
    if (message.author.id !== myUserId || !message.status) return message;
    if (new Date(message.createdAt).getTime() > lastReadMs) return message;
    return { ...message, status: 'read' };
  });
}

export function updateMessageInChatPages(
  old: InfiniteData<ChatMessagesPage> | undefined,
  messageId: string,
  patch: ChatMessage,
): InfiniteData<ChatMessagesPage> | undefined {
  return mapPages(old, (message) => (message.id === messageId ? patch : message));
}

export function updateMessageInChatPagesWithReplyQuotes(
  old: InfiniteData<ChatMessagesPage> | undefined,
  updated: ChatMessage,
): InfiniteData<ChatMessagesPage> | undefined {
  if (!old?.pages.length) return old;
  const quoteBody = replyQuoteBodyFromMessage(updated);
  return {
    pageParams: old.pageParams,
    pages: old.pages.map((page) => ({
      ...page,
      messages: page.messages.map((message) => {
        if (message.id === updated.id) return updated;
        if (message.replyTo?.id === updated.id) {
          return {
            ...message,
            replyTo: { ...message.replyTo, body: quoteBody },
          };
        }
        return message;
      }),
    })),
  };
}

export function removeMessageFromChatPages(
  old: InfiniteData<ChatMessagesPage> | undefined,
  messageId: string,
): InfiniteData<ChatMessagesPage> | undefined {
  if (!old?.pages.length) return old;
  return {
    pageParams: old.pageParams,
    pages: old.pages.map((page) => ({
      ...page,
      messages: page.messages.filter((m) => m.id !== messageId),
    })),
  };
}
