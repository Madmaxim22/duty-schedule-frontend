import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import type { UserRole } from '@/shared/api/types';
import { Modal } from '@/shared/ui/Modal';
import { Avatar } from '@/shared/ui/Avatar';
import { PhotoGalleryModal } from '@/features/settings/PhotoGalleryModal';
import { useMediaMinMd } from '@/shared/hooks/useMediaMinMd';

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
  const isMinMd = useMediaMinMd();
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  function handleGalleryUserUpdated() {
    setAvatarVersion(Date.now());
    onAvatarUpdated?.();
  }

  const displayName = user?.fullName ?? '';
  const roleLabel = user ? ROLE_LABELS[user.role] : '';

  const heroSection = (
    <section className="profile-modal__hero" aria-labelledby="profile-identity-heading">
      <div className="profile-modal__avatar-wrap">
        <Avatar
          fullName={displayName || '?'}
          avatarUrl={user?.avatarUrl}
          focusX={user?.avatarFocusX}
          focusY={user?.avatarFocusY}
          size="lg"
          cacheBust={avatarVersion || undefined}
        />
      </div>

      <div className="profile-modal__identity">
        <h3 id="profile-identity-heading" className="profile-modal__name">
          {displayName || '—'}
        </h3>
        <p className="profile-modal__email">{user?.email}</p>
        {roleLabel ? <span className="profile-modal__role">{roleLabel}</span> : null}
      </div>
    </section>
  );

  return (
    <Modal
      open={open}
      title="Профиль"
      onClose={onClose}
      align={isMinMd ? 'center' : 'sheet'}
      panelClassName={isMinMd ? 'modal__panel--profile' : undefined}
    >
      <div className={isMinMd ? 'profile-modal profile-modal--wide' : 'profile-modal'}>
        {isMinMd ? (
          <>
            <aside className="profile-modal__aside">{heroSection}</aside>
            <div className="profile-modal__main">
              <h3 id="profile-gallery-heading-wide" className="profile-modal__section-title">
                Галерея фото
              </h3>
              <PhotoGalleryModal
                embedded
                open={open}
                displayName={displayName}
                onClose={() => {}}
                onUserUpdated={handleGalleryUserUpdated}
              />
            </div>
          </>
        ) : (
          <>
            {heroSection}

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
          </>
        )}
      </div>
    </Modal>
  );
}
