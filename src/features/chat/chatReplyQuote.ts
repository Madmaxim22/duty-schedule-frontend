import type { ChatMessageReplyTo } from '@/shared/api/types';
import { attachmentPreviewLabel } from './chatAttachmentUtils';

const COMPOSER_PREVIEW_MAX = 100;
const REPLY_QUOTE_MAX = 120;

export const DELETED_MESSAGE_BODY = 'Сообщение удалено';

export function truncateReplyPreview(body: string, max = COMPOSER_PREVIEW_MAX): string {
  if (body.length <= max) return body;
  return `${body.slice(0, max - 1)}…`;
}

/** Текст цитаты для replyTo (как replyQuoteBody на backend). */
export function replyQuoteBodyFromMessage(message: {
  body: string;
  deleted?: boolean;
  attachments?: Array<{ mimeType: string }>;
}): string {
  if (message.deleted) return DELETED_MESSAGE_BODY;
  const trimmed = message.body.trim();
  if (trimmed.length > 0) {
    return trimmed.length <= REPLY_QUOTE_MAX
      ? trimmed
      : `${trimmed.slice(0, REPLY_QUOTE_MAX - 1)}…`;
  }
  if (message.attachments && message.attachments.length > 0) {
    return attachmentPreviewLabel(message.attachments);
  }
  return '';
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
