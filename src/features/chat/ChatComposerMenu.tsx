import { useEffect, useId, useRef, useState } from 'react';
import { ChatAttachmentPicker, PaperclipIcon, type ChatAttachmentPickerHandle } from './ChatAttachmentPicker';

type Props = {
  disabled?: boolean;
  maxFiles: number;
  currentCount: number;
  onFilesSelected: (files: File[]) => void;
};

function MoreVertIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="6" r="1.75" fill="currentColor" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" />
      <circle cx="12" cy="18" r="1.75" fill="currentColor" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="6.5" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="m16.5 10.5 5-3v9l-5-3v-3Z" fill="currentColor" />
    </svg>
  );
}

export function ChatComposerMenu({ disabled, maxFiles, currentCount, onFilesSelected }: Props) {
  const [open, setOpen] = useState(false);
  const photoPickerRef = useRef<ChatAttachmentPickerHandle>(null);
  const videoPickerRef = useRef<ChatAttachmentPickerHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const canAttach = currentCount < maxFiles;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleAttachPhoto = () => {
    setOpen(false);
    photoPickerRef.current?.open();
  };

  const handleAttachVideo = () => {
    setOpen(false);
    videoPickerRef.current?.open();
  };

  return (
    <div className="chat-room__composer-menu" ref={rootRef}>
      <button
        type="button"
        className="chat-room__composer-menu-btn"
        disabled={disabled}
        aria-label="Меню вложений"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertIcon />
      </button>
      {open ? (
        <div id={menuId} className="chat-room__composer-menu-popover" role="menu">
          <button
            type="button"
            role="menuitem"
            className="chat-room__composer-menu-item"
            disabled={disabled || !canAttach}
            onClick={handleAttachPhoto}
          >
            <PaperclipIcon />
            <span>Фото</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="chat-room__composer-menu-item"
            disabled={disabled || !canAttach}
            onClick={handleAttachVideo}
          >
            <VideoIcon />
            <span>Видео</span>
          </button>
        </div>
      ) : null}
      <ChatAttachmentPicker
        ref={photoPickerRef}
        hideButton
        kind="image"
        disabled={disabled}
        maxFiles={maxFiles}
        currentCount={currentCount}
        onFilesSelected={onFilesSelected}
      />
      <ChatAttachmentPicker
        ref={videoPickerRef}
        hideButton
        kind="video"
        disabled={disabled}
        maxFiles={maxFiles}
        currentCount={currentCount}
        onFilesSelected={onFilesSelected}
      />
    </div>
  );
}
