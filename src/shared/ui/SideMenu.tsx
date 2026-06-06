import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNativeBackHandler } from '@/shared/capacitor/nativeBackHandler';

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function SideMenu({ open, onClose, children }: Props) {
  useNativeBackHandler(open, onClose);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="side-menu" role="dialog" aria-modal="true" aria-label="Меню">
      <button type="button" className="side-menu__overlay" aria-label="Закрыть меню" onClick={onClose} />
      <nav className="side-menu__panel">{children}</nav>
    </div>,
    document.body,
  );
}
