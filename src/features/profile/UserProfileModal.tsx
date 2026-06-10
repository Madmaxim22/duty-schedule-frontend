import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/shared/api/client';
import { createDirectChat } from '@/shared/api/chat';
import type { PublicUserProfile, UserRole } from '@/shared/api/types';
import { Modal } from '@/shared/ui/Modal';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { useMediaMinMd } from '@/shared/hooks/useMediaMinMd';
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isMinMd = useMediaMinMd();

  const directMutation = useMutation({
    mutationFn: (userId: string) => createDirectChat(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      onClose();
      navigate(`/chat/${data.room.id}`);
    },
  });

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
  const showMessageAction = Boolean(userId && userId !== currentUser?.id);

  const heroSection = (
    <section className="profile-modal__hero" aria-labelledby="user-profile-identity-heading">
      <div className="profile-modal__avatar-wrap">
        <Avatar
          fullName={displayName || '?'}
          avatarUrl={profile?.avatarUrl ?? target?.avatarUrl}
          focusX={profile?.avatarFocusX ?? target?.avatarFocusX}
          focusY={profile?.avatarFocusY ?? target?.avatarFocusY}
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
          <span className="profile-modal__role profile-modal__role--placeholder">…</span>
        ) : null}
      </div>
    </section>
  );

  const messageAction = showMessageAction ? (
    <div className="profile-modal__actions">
      <Button
        variant="secondary"
        disabled={directMutation.isPending}
        onClick={() => directMutation.mutate(userId!)}
      >
        {directMutation.isPending ? '…' : 'Написать'}
      </Button>
      {directMutation.error ? (
        <p className="form-message form-message--error">
          {(directMutation.error as Error).message}
        </p>
      ) : null}
    </div>
  ) : null;

  const gallery = userId ? (
    <UserPhotoGallery
      userId={userId}
      displayName={displayName}
      currentUserId={currentUser?.id}
      enabled={Boolean(target)}
      layout={isMinMd ? 'expanded' : 'stack'}
      headingId={isMinMd ? 'user-profile-gallery-heading-wide' : 'user-profile-gallery-heading'}
    />
  ) : null;

  return (
    <Modal
      open={Boolean(target)}
      title="Профиль"
      onClose={onClose}
      align={isMinMd ? 'center' : 'sheet'}
      panelClassName={isMinMd ? 'modal__panel--profile' : undefined}
    >
      <div className={isMinMd ? 'profile-modal profile-modal--wide' : 'profile-modal'}>
        {isLoading && !profile ? <p className="page-loading">Загрузка…</p> : null}
        {error ? (
          <p className="form-message form-message--error">{(error as Error).message}</p>
        ) : null}
        {target ? (
          isMinMd ? (
            <>
              <aside className="profile-modal__aside">
                {heroSection}
                {messageAction}
              </aside>
              <div className="profile-modal__main">
                <h3 id="user-profile-gallery-heading-wide" className="profile-modal__section-title">
                  Галерея фото
                </h3>
                {gallery}
              </div>
            </>
          ) : (
            <>
              {heroSection}
              {messageAction}
              {gallery}
            </>
          )
        ) : null}
      </div>
    </Modal>
  );
}
