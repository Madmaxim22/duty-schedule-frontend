import { forwardRef, useImperativeHandle, useRef } from 'react';

export type ChatAttachmentPickerHandle = {
  open: () => void;
};

export type ChatAttachmentPickerKind = 'image' | 'video';

type Props = {
  disabled?: boolean;
  maxFiles: number;
  currentCount: number;
  onFilesSelected: (files: File[]) => void;
  kind?: ChatAttachmentPickerKind;
  /** Скрыть кнопку-скрепку (выбор через внешнее меню). */
  hideButton?: boolean;
};

const ACCEPT_BY_KIND: Record<ChatAttachmentPickerKind, string> = {
  image: 'image/jpeg,image/png,image/webp,image/gif',
  video: 'video/mp4,video/webm,video/quicktime',
};

export function PaperclipIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16.5 6.5v9.25a4.25 4.25 0 0 1-8.5 0V7.75a2.75 2.75 0 0 1 5.5 0v7.5a1.25 1.25 0 0 1-2.5 0V8.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const ChatAttachmentPicker = forwardRef<ChatAttachmentPickerHandle, Props>(
  function ChatAttachmentPicker(
    {
      disabled,
      maxFiles,
      currentCount,
      onFilesSelected,
      kind = 'image',
      hideButton = false,
    },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const canAddMore = currentCount < maxFiles;

    useImperativeHandle(ref, () => ({
      open: () => {
        if (!disabled && canAddMore) inputRef.current?.click();
      },
    }));

    return (
      <>
        {!hideButton ? (
          <button
            type="button"
            className="chat-room__attach"
            disabled={disabled || !canAddMore}
            aria-label={kind === 'video' ? 'Прикрепить видео' : 'Прикрепить изображение'}
            onClick={() => inputRef.current?.click()}
          >
            <PaperclipIcon />
          </button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          className="visually-hidden"
          accept={ACCEPT_BY_KIND[kind]}
          multiple={kind === 'image'}
          disabled={disabled || !canAddMore}
          onChange={(e) => {
            const list = e.target.files;
            if (!list?.length) return;
            const remaining = maxFiles - currentCount;
            const picked = Array.from(list).slice(0, remaining);
            onFilesSelected(picked);
            e.target.value = '';
          }}
        />
      </>
    );
  },
);
