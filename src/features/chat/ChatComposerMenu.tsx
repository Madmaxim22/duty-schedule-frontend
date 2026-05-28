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

export function ChatComposerMenu({ disabled, maxFiles, currentCount, onFilesSelected }: Props) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<ChatAttachmentPickerHandle>(null);
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

  const handleAttach = () => {
    setOpen(false);
    pickerRef.current?.open();
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
            onClick={handleAttach}
          >
            <PaperclipIcon />
            <span>Фото</span>
          </button>
        </div>
      ) : null}
      <ChatAttachmentPicker
        ref={pickerRef}
        hideButton
        disabled={disabled}
        maxFiles={maxFiles}
        currentCount={currentCount}
        onFilesSelected={onFilesSelected}
      />
    </div>
  );
}
