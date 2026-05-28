import type { ChatMessageReplyTo } from '@/shared/api/types';

const COMPOSER_PREVIEW_MAX = 100;

export function truncateReplyPreview(body: string, max = COMPOSER_PREVIEW_MAX): string {
  if (body.length <= max) return body;
  return `${body.slice(0, max - 1)}…`;
}

export function getReplyQuoteAuthorLabel(
  replyTo: ChatMessageReplyTo,
  currentUserId: string | undefined,
  isDirect: boolean,
): string {
  if (isDirect && currentUserId && replyTo.author.id === currentUserId) {
    return 'Вы';
  }
  return replyTo.author.fullName;
}
