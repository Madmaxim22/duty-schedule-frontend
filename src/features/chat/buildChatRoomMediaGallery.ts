import type { ChatMessage } from '@/shared/api/types';

export type ChatMediaGalleryKind = 'image' | 'video';

export type ChatMediaGalleryItem = {
  attachmentId: string;
  kind: ChatMediaGalleryKind;
  url: string;
  posterUrl?: string;
  mimeType: string;
  fileName: string;
  messageId: string;
  authorName: string;
  createdAt: string;
};

export function buildChatRoomMediaGallery(messages: ChatMessage[]): ChatMediaGalleryItem[] {
  const items: ChatMediaGalleryItem[] = [];
  for (const msg of messages) {
    if (msg.deleted) continue;
    const attachments = msg.attachments ?? [];
    for (const att of attachments) {
      const kind: ChatMediaGalleryKind = att.mimeType.startsWith('video/') ? 'video' : 'image';
      items.push({
        attachmentId: att.id,
        kind,
        url: att.url,
        posterUrl: att.posterUrl,
        mimeType: att.mimeType,
        fileName: att.fileName,
        messageId: msg.id,
        authorName: msg.author.fullName,
        createdAt: msg.createdAt,
      });
    }
  }
  return items;
}
