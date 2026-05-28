import type { ChatMessage } from '@/shared/api/types';

export type ChatMediaGalleryItem = {
  attachmentId: string;
  url: string;
  fileName: string;
  messageId: string;
  authorName: string;
  createdAt: string;
};

export function buildChatRoomMediaGallery(messages: ChatMessage[]): ChatMediaGalleryItem[] {
  const items: ChatMediaGalleryItem[] = [];
  for (const msg of messages) {
    const attachments = msg.attachments ?? [];
    for (const att of attachments) {
      items.push({
        attachmentId: att.id,
        url: att.url,
        fileName: att.fileName,
        messageId: msg.id,
        authorName: msg.author.fullName,
        createdAt: msg.createdAt,
      });
    }
  }
  return items;
}
