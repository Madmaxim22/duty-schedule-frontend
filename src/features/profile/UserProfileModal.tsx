import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import type { PublicUserProfile, UserRole } from '@/shared/api/types';
import { Modal } from '@/shared/ui/Modal';
import { Avatar } from '@/shared/ui/Avatar';
import { useAuth } from '@/features/auth/AuthContext';
import type { DutyProfileTarget } from './dutyProfileTarget';
import { UserPhotoGallery } from './UserPhotoGallery';

type Props = {
  target: DutyProfileTarget | null;
  onClose: () => void;
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор',
  user: 'Пользователь',
};

export function UserProfileModal({ target, onClose }: Props) {
  const { user: currentUser } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-profile', target?.userId],
    queryFn: () =>
      apiRequest<{ user: PublicUserProfile }>(`/users/${target!.userId}/profile`),
    enabled: Boolean(target?.userId),
  });

  const profile = data?.user;
  const displayName = profile?.fullName ?? target?.fullName ?? '';
  const roleLabel = profile ? ROLE_LABELS[profile.role] : '';
  const userId = target?.userId ?? profile?.id;

  return (
    <Modal open={Boolean(target)} title="Профиль" onClose={onClose}>
      <div className="profile-modal">
        {isLoading && !profile ? <p className="page-loading">Загрузка…</p> : null}
        {error ? (
          <p className="form-message form-message--error">{(error as Error).message}</p>
        ) : null}
        {target ? (
          <>
            <section className="profile-modal__hero" aria-labelledby="user-profile-identity-heading">
              <div className="profile-modal__avatar-wrap">
                <Avatar
                  fullName={displayName || '?'}
                  avatarUrl={profile?.avatarUrl ?? target.avatarUrl}
                  size="lg"
                />
              </div>
              <div className="profile-modal__identity">
                <h3 id="user-profile-identity-heading" className="profile-modal__name">
                  {displayName || '—'}
                </h3>
                {roleLabel ? (
                  <span className="profile-modal__role">{roleLabel}</span>
                ) : isLoading ? (
                  <span className="profile-modal__role profile-modal__role--placeholder">
                    …
                  </span>
                ) : null}
              </div>
            </section>

            {userId ? (
              <UserPhotoGallery
                userId={userId}
                displayName={displayName}
                currentUserId={currentUser?.id}
                enabled={Boolean(target)}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </Modal>
  );
}
