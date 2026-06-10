import { useEffect, type ReactNode } from 'react';
import { useNativeBackHandler } from '@/shared/capacitor/nativeBackHandler';

type Props = {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  closeOnEscape?: boolean;
  titleClassName?: string;
  panelClassName?: string;
  align?: 'sheet' | 'center';
};

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  closeOnEscape = true,
  titleClassName,
  panelClassName,
  align = 'sheet',
}: Props) {
  useNativeBackHandler(open, onClose);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, closeOnEscape]);

  if (!open) return null;

  const modalClass = align === 'center' ? 'modal modal--center' : 'modal';

  return (
    <div className={modalClass} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button type="button" className="modal__overlay" aria-label="Закрыть" onClick={onClose} />
      <div className={panelClassName ? `modal__panel ${panelClassName}` : 'modal__panel'}>
        <header className="modal__header">
          <h2 id="modal-title" className={titleClassName ? `modal__title ${titleClassName}` : 'modal__title'}>
            {title}
          </h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer ? <footer className="modal__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
