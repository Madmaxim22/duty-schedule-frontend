import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAvatarLikeStatus } from '@/shared/api/client';
import type { AvatarLikeStatus } from '@/shared/api/types';
import { resolveAvatarUrl } from '@/shared/lib/avatarUrl';
import { AvatarLikeButton } from './AvatarLikeButton';
import { AvatarLikeHeartsOverlay, useAvatarLikeHeartsBurst } from './AvatarLikeHeartsBurst';
import { useDebouncedLikeSync } from './useDebouncedLikeSync';

type Props = {
  open: boolean;
  targetUserId: string | undefined;
  currentUserId: string | undefined;
  fullName: string;
  avatarUrl: string | null;
  onClose: () => void;
};

export function AvatarPreviewModal({
  open,
  targetUserId,
  currentUserId,
  fullName,
  avatarUrl,
  onClose,
}: Props) {
  const src = resolveAvatarUrl(avatarUrl);
  const queryClient = useQueryClient();
  const { particles, burst } = useAvatarLikeHeartsBurst();

  const { data: likeStatus, isLoading: likesLoading } = useQuery({
    queryKey: ['avatar-likes', targetUserId],
    queryFn: () => getAvatarLikeStatus(targetUserId!),
    enabled: open && Boolean(targetUserId),
  });

  const onSynced = useCallback(
    (status: AvatarLikeStatus) => {
      queryClient.setQueryData(['avatar-likes', targetUserId], status);
    },
    [queryClient, targetUserId],
  );

  const { localLiked, displayCount, toggleLike } = useDebouncedLikeSync({
    targetUserId,
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
  const showLikeButton = Boolean(targetUserId && !isOwnPhoto);
  const canInteract = likeStatus?.canLike ?? showLikeButton;
  const likeLabel = localLiked
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
          <AvatarLikeHeartsOverlay particles={particles} />
          <img src={src} alt={fullName} className="avatar-preview__image" />
          <div className="avatar-preview__actions">
            {showLikeButton ? (
              <AvatarLikeButton
                liked={localLiked}
                label={likeLabel}
                onClick={toggleLike}
                disabled={!canInteract}
              />
            ) : null}
            {!likesLoading ? (
              <span className="avatar-preview__like-count" aria-live="polite">
                {displayCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
