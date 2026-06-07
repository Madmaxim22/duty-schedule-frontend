import { ChatAttachmentPreviewThumb } from './ChatAttachmentPreviewThumb';
import { isVideoFile } from './chatAttachmentUtils';

type PreviewItem = {
  file: File;
  url: string;
};

type Props = {
  items: PreviewItem[];
  onRemove: (index: number) => void;
};

export function ChatAttachmentPreviewStrip({ items, onRemove }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="chat-room__attachment-preview-strip" role="list" aria-label="Вложения перед отправкой">
      {items.map((item, index) => (
        <div key={`${item.file.name}-${item.file.lastModified}-${index}`} className="chat-room__attachment-preview" role="listitem">
          <ChatAttachmentPreviewThumb url={item.url} isVideo={isVideoFile(item.file)} />
          <button
            type="button"
            className="chat-room__attachment-preview-remove"
            aria-label="Убрать вложение"
            onClick={() => onRemove(index)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
