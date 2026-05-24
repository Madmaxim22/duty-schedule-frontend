import { useEffect } from 'react';
import { resolveAvatarUrl } from '@/shared/lib/avatarUrl';

type Props = {
  open: boolean;
  fullName: string;
  avatarUrl: string | null;
  onClose: () => void;
};

export function AvatarPreviewModal({ open, fullName, avatarUrl, onClose }: Props) {
  const src = resolveAvatarUrl(avatarUrl);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open || !src) return null;

  return (
    <div
      className="avatar-preview"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-preview-title"
    >
      <button
        type="button"
        className="avatar-preview__overlay"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div className="avatar-preview__panel">
        <header className="avatar-preview__header">
          <h2 id="avatar-preview-title" className="avatar-preview__title">
            {fullName}
          </h2>
          <button
            type="button"
            className="avatar-preview__close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </header>
        <div className="avatar-preview__body">
          <img src={src} alt={fullName} className="avatar-preview__image" />
        </div>
      </div>
    </div>
  );
}
