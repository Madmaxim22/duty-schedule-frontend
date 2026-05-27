import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AvatarFocusEditor } from '@/features/settings/AvatarFocusEditor';
import { getPhotoLikeStatus } from '@/shared/api/client';
import type { PhotoLikeStatus } from '@/shared/api/types';
import { avatarImageStyle } from '@/shared/lib/avatarFocus';
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
  focusX?: number;
  focusY?: number;
  avatarCacheBust?: number;
  isCurrentPhoto?: boolean;
  ownerActionsBusy?: boolean;
  onSetAsAvatar?: () => void;
  onDeletePhoto?: () => void;
  onFocusChange?: (focusX: number, focusY: number) => void;
  onClose: () => void;
};

export function AvatarPreviewModal({
  open,
  photoId,
  targetUserId,
  currentUserId,
  fullName,
  avatarUrl,
  focusX = 50,
  focusY = 50,
  avatarCacheBust,
  isCurrentPhoto = false,
  ownerActionsBusy = false,
  onSetAsAvatar,
  onDeletePhoto,
  onFocusChange,
  onClose,
}: Props) {
  const src = resolveAvatarUrl(avatarUrl, avatarCacheBust);
  const queryClient = useQueryClient();
  const { particles, burst } = useAvatarLikeHeartsBurst();
  const [editingFocus, setEditingFocus] = useState(false);
  const [localFocusX, setLocalFocusX] = useState(focusX);
  const [localFocusY, setLocalFocusY] = useState(focusY);

  useEffect(() => {
    if (!open) {
      setEditingFocus(false);
      return;
    }
    setLocalFocusX(focusX);
    setLocalFocusY(focusY);
  }, [open, focusX, focusY]);

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
  const canEditFocus = isOwnPhoto && Boolean(onFocusChange);
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

  const handleFocusChange = (nextX: number, nextY: number) => {
    setLocalFocusX(nextX);
    setLocalFocusY(nextY);
    onFocusChange?.(nextX, nextY);
  };

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
          {editingFocus && canEditFocus ? (
            <AvatarFocusEditor
              src={src}
              focusX={localFocusX}
              focusY={localFocusY}
              onChange={handleFocusChange}
              disabled={ownerActionsBusy}
            />
          ) : (
            <img
              src={src}
              alt={fullName}
              className="avatar-preview__image"
              style={avatarImageStyle(localFocusX, localFocusY)}
            />
          )}
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
            {canEditFocus ? (
              <button
                type="button"
                className="avatar-preview__action-btn"
                disabled={ownerActionsBusy}
                onClick={() => setEditingFocus((v) => !v)}
              >
                {editingFocus ? 'Готово' : 'Настроить кадр'}
              </button>
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
