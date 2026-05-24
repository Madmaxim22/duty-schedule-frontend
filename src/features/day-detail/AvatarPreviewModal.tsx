import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPhotoLikeStatus } from '@/shared/api/client';
import type { PhotoLikeStatus } from '@/shared/api/types';
import { resolveAvatarUrl } from '@/shared/lib/avatarUrl';
import { AvatarLikeButton } from './AvatarLikeButton';
import { AvatarLikeHeartsOverlay, useAvatarLikeHeartsBurst } from './AvatarLikeHeartsBurst';
import { useDebouncedLikeSync } from './useDebouncedLikeSync';

type Props = {
  open: boolean;
  photoId: string | undefined;
  targetUserId: string | undefined;
  currentUserId: string | undefined;
  fullName: string;
  avatarUrl: string | null;
  avatarCacheBust?: number;
  isCurrentPhoto?: boolean;
  ownerActionsBusy?: boolean;
  onSetAsAvatar?: () => void;
  onDeletePhoto?: () => void;
  onClose: () => void;
};

export function AvatarPreviewModal({
  open,
  photoId,
  targetUserId,
  currentUserId,
  fullName,
  avatarUrl,
  avatarCacheBust,
  isCurrentPhoto = false,
  ownerActionsBusy = false,
  onSetAsAvatar,
  onDeletePhoto,
  onClose,
}: Props) {
  const src = resolveAvatarUrl(avatarUrl, avatarCacheBust);
  const queryClient = useQueryClient();
  const { particles, burst } = useAvatarLikeHeartsBurst();

  const { data: likeStatus, isLoading: likesLoading } = useQuery({
    queryKey: ['photo-likes', photoId],
    queryFn: () => getPhotoLikeStatus(photoId!),
    enabled: open && Boolean(photoId),
  });

  const onSynced = useCallback(
    (status: PhotoLikeStatus) => {
      queryClient.setQueryData(['photo-likes', photoId], status);
      if (photoId) {
        queryClient.invalidateQueries({ queryKey: ['my-photos'] });
      }
    },
    [queryClient, photoId],
  );

  const { localLiked, displayCount, toggleLike } = useDebouncedLikeSync({
    photoId,
    open,
    canLike: likeStatus?.canLike ?? false,
    serverLiked: likeStatus?.likedByMe ?? false,
    serverCount: likeStatus?.likeCount ?? 0,
    onSynced,
    onLikedBurst: burst,
  });

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

  const isOwnPhoto = Boolean(
    currentUserId && targetUserId && currentUserId === targetUserId,
  );
  const showLikeButton = Boolean(photoId && targetUserId);
  const showOwnerActions = isOwnPhoto && Boolean(onSetAsAvatar && onDeletePhoto);
  const likeCount = likeStatus?.likeCount ?? 0;
  const likeDisabled = isOwnPhoto || !(likeStatus?.canLike ?? false);
  const heartFilled = isOwnPhoto ? likeCount > 0 : localLiked;
  const likeLabel = isOwnPhoto
    ? likeCount > 0
      ? `На ваше фото поставили ${likeCount} лайк(ов)`
      : 'Нельзя лайкнуть своё фото'
    : localLiked
      ? `Убрать лайк с фото ${fullName}`
      : `Нравится фото ${fullName}`;

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
          <div className="avatar-preview__actions">
            {showLikeButton ? (
              <div className="avatar-preview__like-wrap">
                <AvatarLikeHeartsOverlay particles={particles} />
                <AvatarLikeButton
                  liked={heartFilled}
                  label={likeLabel}
                  onClick={toggleLike}
                  disabled={likeDisabled}
                />
              </div>
            ) : null}
            {!likesLoading && displayCount > 0 ? (
              <span className="avatar-preview__like-count" aria-live="polite">
                {displayCount}
              </span>
            ) : null}
            {showOwnerActions ? (
              <>
                {!isCurrentPhoto ? (
                  <button
                    type="button"
                    className="avatar-preview__action-btn"
                    disabled={ownerActionsBusy}
                    onClick={onSetAsAvatar}
                  >
                    В аватар
                  </button>
                ) : null}
                <button
                  type="button"
                  className="avatar-preview__action-btn avatar-preview__action-btn--danger"
                  disabled={ownerActionsBusy}
                  onClick={onDeletePhoto}
                >
                  Удалить
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
