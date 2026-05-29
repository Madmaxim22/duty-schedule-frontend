import type { ChatAttachment } from '@/shared/api/types';

type PendingItem = {
  file: File;
  url: string;
};

type Props = {
  keptAttachments: ChatAttachment[];
  pendingItems: PendingItem[];
  onRemoveKept: (attachmentId: string) => void;
  onRemovePending: (index: number) => void;
};

export function ChatEditAttachmentsStrip({
  keptAttachments,
  pendingItems,
  onRemoveKept,
  onRemovePending,
}: Props) {
  if (keptAttachments.length === 0 && pendingItems.length === 0) return null;

  return (
    <div className="chat-room__attachment-preview-strip" role="list" aria-label="Вложения сообщения">
      {keptAttachments.map((attachment) => (
        <div key={attachment.id} className="chat-room__attachment-preview" role="listitem">
          <img
            src={attachment.url}
            alt=""
            className="chat-room__attachment-preview-img"
          />
          <button
            type="button"
            className="chat-room__attachment-preview-remove"
            aria-label="Убрать вложение"
            onClick={() => onRemoveKept(attachment.id)}
          >
            ×
          </button>
        </div>
      ))}
      {pendingItems.map((item, index) => (
        <div
          key={`${item.file.name}-${item.file.lastModified}-${index}`}
          className="chat-room__attachment-preview"
          role="listitem"
        >
          <img src={item.url} alt="" className="chat-room__attachment-preview-img" />
          <button
            type="button"
            className="chat-room__attachment-preview-remove"
            aria-label="Убрать вложение"
            onClick={() => onRemovePending(index)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
