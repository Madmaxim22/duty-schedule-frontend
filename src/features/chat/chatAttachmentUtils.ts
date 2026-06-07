import type { ChatAttachment } from '@/shared/api/types';

export function isVideoAttachment(att: { mimeType: string }): boolean {
  return att.mimeType.startsWith('video/');
}

export function isImageAttachment(att: { mimeType: string }): boolean {
  return att.mimeType.startsWith('image/');
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function attachmentPreviewLabel(
  attachments: Array<{ mimeType: string }> | undefined,
): string {
  if (!attachments?.length) return '';
  const hasImage = attachments.some(isImageAttachment);
  const hasVideo = attachments.some(isVideoAttachment);
  if (hasImage && hasVideo) return 'Медиа';
  if (hasVideo) return 'Видео';
  if (hasImage) return 'Фото';
  return 'Вложение';
}

export function formatVideoDuration(durationMs?: number): string | null {
  if (durationMs == null || durationMs <= 0) return null;
  const totalSec = Math.floor(durationMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export const MIXED_MEDIA_ERROR = 'Фото и видео нельзя отправить в одном сообщении';

export function wouldMixMediaKinds(input: {
  pendingFiles: File[];
  keptAttachments?: ChatAttachment[];
}): boolean {
  const kinds = new Set<'image' | 'video'>();
  for (const file of input.pendingFiles) {
    if (isVideoFile(file)) kinds.add('video');
    else if (isImageFile(file)) kinds.add('image');
  }
  for (const att of input.keptAttachments ?? []) {
    if (isVideoAttachment(att)) kinds.add('video');
    else if (isImageAttachment(att)) kinds.add('image');
  }
  return kinds.has('image') && kinds.has('video');
}
