import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import type { UserRole } from '@/shared/api/types';
import { Modal } from '@/shared/ui/Modal';
import { Avatar } from '@/shared/ui/Avatar';
import { ThemePicker } from '@/features/settings/ThemePicker';
import { PhotoGalleryModal } from '@/features/settings/PhotoGalleryModal';
import {
  applyTheme,
  loadTheme,
  saveTheme,
  type AppTheme,
} from '@/features/settings/theme';

type Props = {
  open: boolean;
  onClose: () => void;
  onAvatarUpdated?: () => void;
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор',
  user: 'Пользователь',
};

export function ProfileModal({ open, onClose, onAvatarUpdated }: Props) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<AppTheme>(loadTheme);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTheme(loadTheme());
  }, [open]);

  function handleThemeChange(next: AppTheme) {
    setTheme(next);
    saveTheme(next);
    applyTheme(next);
  }

  function handleGalleryUserUpdated() {
    setAvatarVersion(Date.now());
    onAvatarUpdated?.();
  }

  const displayName = user?.fullName ?? '';
  const roleLabel = user ? ROLE_LABELS[user.role] : '';

  return (
    <Modal open={open} title="Профиль" onClose={onClose}>
      <div className="profile-modal">
        <section className="profile-modal__hero" aria-labelledby="profile-identity-heading">
          <div className="profile-modal__avatar-wrap">
            <Avatar
              fullName={displayName || '?'}
              avatarUrl={user?.avatarUrl}
              size="lg"
              cacheBust={avatarVersion || undefined}
            />
          </div>

          <div className="profile-modal__identity">
            <h3 id="profile-identity-heading" className="profile-modal__name">
              {displayName || '—'}
            </h3>
            <p className="profile-modal__email">{user?.email}</p>
            {roleLabel ? (
              <span className="profile-modal__role">{roleLabel}</span>
            ) : null}
          </div>
        </section>

        <section className="profile-modal__section" aria-labelledby="profile-gallery-heading">
          <h3 id="profile-gallery-heading" className="profile-modal__section-title">
            Галерея фото
          </h3>
          <p className="profile-modal__section-hint">
            До 20 фотографий. Загрузка, просмотр и выбор аватара — в отдельном окне.
          </p>
          <button
            type="button"
            className="profile-modal__action-btn"
            onClick={() => setGalleryOpen(true)}
          >
            Открыть галерею
          </button>
        </section>

        <PhotoGalleryModal
          open={galleryOpen}
          displayName={displayName}
          onClose={() => setGalleryOpen(false)}
          onUserUpdated={handleGalleryUserUpdated}
        />

        <section className="profile-modal__section" aria-labelledby="profile-theme-heading">
          <h3 id="profile-theme-heading" className="profile-modal__section-title">
            Тема оформления
          </h3>
          <p className="profile-modal__section-hint">
            Цветовая палитра интерфейса. Сохраняется на этом устройстве.
          </p>
          <ThemePicker theme={theme} onChange={handleThemeChange} />
        </section>
      </div>
    </Modal>
  );
}
