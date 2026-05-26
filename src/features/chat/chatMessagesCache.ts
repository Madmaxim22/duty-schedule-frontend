import type { InfiniteData } from '@tanstack/react-query';
import type { ChatMessage } from '@/shared/api/types';

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
