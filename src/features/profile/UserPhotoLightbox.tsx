import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AvatarFocusEditor } from '@/features/settings/AvatarFocusEditor';
import { AvatarLikeButton } from '@/features/day-detail/AvatarLikeButton';
import { AvatarLikeHeartsOverlay, useAvatarLikeHeartsBurst } from '@/features/day-detail/AvatarLikeHeartsBurst';
import { useDebouncedLikeSync } from '@/features/day-detail/useDebouncedLikeSync';
import { getPhotoLikeStatus } from '@/shared/api/client';
import type { PhotoLikeStatus, UserPhoto } from '@/shared/api/types';
import { resolveAvatarUrl } from '@/shared/lib/avatarUrl';
import { useNativeBackHandler } from '@/shared/capacitor/nativeBackHandler';

const SWIPE_THRESHOLD_PX = 48;

type Props = {
  open: boolean;
  photos: UserPhoto[];
  initialIndex: number;
  displayName: string;
  targetUserId: string;
  currentUserId?: string;
  cacheBust?: number;
  ownerActionsBusy?: boolean;
  onSetAsAvatar?: (photoId: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  onFocusChange?: (photoId: string, focusX: number, focusY: number) => void;
  onClose: () => void;
};

function formatPhotoDate(createdAt: string) {
  return new Date(createdAt).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function preloadImage(url: string) {
  const img = new Image();
  img.src = url;
}

type SlideActionsProps = {
  photo: UserPhoto;
  displayName: string;
  targetUserId: string;
  currentUserId?: string;
  ownerActionsBusy?: boolean;
  onSetAsAvatar?: (photoId: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  onFocusChange?: (photoId: string, focusX: number, focusY: number) => void;
  editingFocus: boolean;
  onEditingFocusChange: (value: boolean) => void;
};

function canEditPhotoFocus(
  currentUserId: string | undefined,
  targetUserId: string,
  onFocusChange?: (photoId: string, focusX: number, focusY: number) => void,
) {
  return Boolean(currentUserId && currentUserId === targetUserId && onFocusChange);
}

function SlideActions({
  photo,
  displayName,
  targetUserId,
  currentUserId,
  ownerActionsBusy,
  onSetAsAvatar,
  onDeletePhoto,
  onFocusChange,
  editingFocus,
  onEditingFocusChange,
}: SlideActionsProps) {
  const queryClient = useQueryClient();
  const { particles, burst } = useAvatarLikeHeartsBurst();

  const { data: likeStatus, isLoading: likesLoading } = useQuery({
    queryKey: ['photo-likes', photo.id],
    queryFn: () => getPhotoLikeStatus(photo.id),
    enabled: Boolean(photo.id),
  });

  const onSynced = useCallback(
    (status: PhotoLikeStatus) => {
      queryClient.setQueryData(['photo-likes', photo.id], status);
      queryClient.invalidateQueries({ queryKey: ['my-photos'] });
      queryClient.invalidateQueries({ queryKey: ['user-photos', targetUserId] });
    },
    [queryClient, photo.id, targetUserId],
  );

  const { localLiked, displayCount, toggleLike } = useDebouncedLikeSync({
    photoId: photo.id,
    open: true,
    canLike: likeStatus?.canLike ?? false,
    serverLiked: likeStatus?.likedByMe ?? false,
    serverCount: likeStatus?.likeCount ?? 0,
    onSynced,
    onLikedBurst: burst,
  });

  const isOwnPhoto = Boolean(currentUserId && currentUserId === targetUserId);
  const showOwnerActions = isOwnPhoto && Boolean(onSetAsAvatar && onDeletePhoto);
  const canEditFocus = canEditPhotoFocus(currentUserId, targetUserId, onFocusChange);
  const likeCount = likeStatus?.likeCount ?? 0;
  const likeDisabled = isOwnPhoto || !(likeStatus?.canLike ?? false);
  const heartFilled = isOwnPhoto ? likeCount > 0 : localLiked;
  const likeLabel = isOwnPhoto
    ? likeCount > 0
      ? `На ваше фото поставили ${likeCount} лайк(ов)`
      : 'Нельзя лайкнуть своё фото'
    : localLiked
      ? `Убрать лайк с фото ${displayName}`
      : `Нравится фото ${displayName}`;

  return (
    <footer className="user-photo-lightbox__footer">
      <div className="user-photo-lightbox__actions">
        <div className="user-photo-lightbox__like-wrap">
          <AvatarLikeHeartsOverlay particles={particles} />
          <AvatarLikeButton
            liked={heartFilled}
            label={likeLabel}
            onClick={toggleLike}
            disabled={likeDisabled}
          />
        </div>
        {!likesLoading && displayCount > 0 ? (
          <span className="user-photo-lightbox__like-count" aria-live="polite">
            {displayCount}
          </span>
        ) : null}
        {photo.isCurrent ? (
          <span className="user-photo-lightbox__badge">Аватар</span>
        ) : null}
        {canEditFocus ? (
          <button
            type="button"
            className="user-photo-lightbox__action-btn"
            disabled={ownerActionsBusy}
            onClick={() => onEditingFocusChange(!editingFocus)}
          >
            {editingFocus ? 'Готово' : 'Настроить кадр'}
          </button>
        ) : null}
        {showOwnerActions ? (
          <>
            {!photo.isCurrent ? (
              <button
                type="button"
                className="user-photo-lightbox__action-btn"
                disabled={ownerActionsBusy}
                onClick={() => onSetAsAvatar?.(photo.id)}
              >
                В аватар
              </button>
            ) : null}
            <button
              type="button"
              className="user-photo-lightbox__action-btn user-photo-lightbox__action-btn--danger"
              disabled={ownerActionsBusy}
              onClick={() => onDeletePhoto?.(photo.id)}
            >
              Удалить
            </button>
          </>
        ) : null}
      </div>
    </footer>
  );
}

export function UserPhotoLightbox({
  open,
  photos,
  initialIndex,
  displayName,
  targetUserId,
  currentUserId,
  cacheBust,
  ownerActionsBusy,
  onSetAsAvatar,
  onDeletePhoto,
  onFocusChange,
  onClose,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [editingFocus, setEditingFocus] = useState(false);
  const [localFocusX, setLocalFocusX] = useState(50);
  const [localFocusY, setLocalFocusY] = useState(50);
  const pointerStartX = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setActiveIndex(initialIndex);
  }, [open, initialIndex]);

  const photo = photos[activeIndex];
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < photos.length - 1;
  const showNav = photos.length > 1;

  useEffect(() => {
    if (!open || !photo) return;
    setEditingFocus(false);
    setLocalFocusX(photo.focusX);
    setLocalFocusY(photo.focusY);
  }, [open, photo?.id, photo?.focusX, photo?.focusY]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => Math.max(0, i - 1));
    setDragOffset(0);
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((i) => Math.min(photos.length - 1, i + 1));
    setDragOffset(0);
  }, [photos.length]);

  useEffect(() => {
    if (!open || !photo) return;
    const prevPhoto = hasPrev ? photos[activeIndex - 1] : null;
    const nextPhoto = hasNext ? photos[activeIndex + 1] : null;
    if (prevPhoto) preloadImage(resolveAvatarUrl(prevPhoto.url, cacheBust) ?? '');
    if (nextPhoto) preloadImage(resolveAvatarUrl(nextPhoto.url, cacheBust) ?? '');
  }, [open, activeIndex, photo, hasPrev, hasNext, photos, cacheBust]);

  useNativeBackHandler(open, onClose);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        goPrev();
      }
      if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        goNext();
      }
    };
    document.addEventListener('keydown', onKey, true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = '';
    };
  }, [open, onClose, hasPrev, hasNext, goPrev, goNext]);

  const finishDrag = useCallback(
    (dx: number) => {
      setDragging(false);
      pointerStartX.current = null;
      if (dx < -SWIPE_THRESHOLD_PX && hasNext) {
        goNext();
        return;
      }
      if (dx > SWIPE_THRESHOLD_PX && hasPrev) {
        goPrev();
        return;
      }
      setDragOffset(0);
    },
    [hasNext, hasPrev, goNext, goPrev],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (!showNav || e.button !== 0 || editingFocus) return;
    pointerStartX.current = e.clientX;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointerStartX.current == null) return;
    const dx = e.clientX - pointerStartX.current;
    const atStart = !hasPrev && dx > 0;
    const atEnd = !hasNext && dx < 0;
    if (atStart || atEnd) {
      setDragOffset(dx * 0.35);
      return;
    }
    setDragOffset(dx);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (pointerStartX.current == null) return;
    const dx = e.clientX - pointerStartX.current;
    finishDrag(dx);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const onPointerCancel = (e: React.PointerEvent) => {
    if (pointerStartX.current == null) return;
    finishDrag(0);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  if (!open || !photo || photos.length === 0) return null;

  const trackTransform = `translateX(calc(${-activeIndex * 100}% + ${dragOffset}px))`;

  return createPortal(
    <div
      className="user-photo-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Фото ${displayName}`}
    >
      <button
        type="button"
        className="user-photo-lightbox__backdrop"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <header className="user-photo-lightbox__header">
        <div className="user-photo-lightbox__meta">
          <span className="user-photo-lightbox__author">{displayName}</span>
          <time className="user-photo-lightbox__time" dateTime={photo.createdAt}>
            {formatPhotoDate(photo.createdAt)}
          </time>
        </div>
        {showNav ? (
          <span className="user-photo-lightbox__counter" aria-live="polite">
            {activeIndex + 1} / {photos.length}
          </span>
        ) : null}
        <button
          type="button"
          className="user-photo-lightbox__close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>
      </header>
      <div ref={viewportRef} className="user-photo-lightbox__viewport">
        {editingFocus &&
        Boolean(currentUserId && currentUserId === targetUserId && onFocusChange) ? (
          <div className="user-photo-lightbox__focus-editor">
            <AvatarFocusEditor
              src={resolveAvatarUrl(photo.url, cacheBust) ?? ''}
              focusX={localFocusX}
              focusY={localFocusY}
              onChange={(nextX, nextY) => {
                setLocalFocusX(nextX);
                setLocalFocusY(nextY);
                onFocusChange?.(photo.id, nextX, nextY);
              }}
              disabled={ownerActionsBusy}
            />
          </div>
        ) : (
          <>
            {showNav && hasPrev ? (
              <button
                type="button"
                className="user-photo-lightbox__nav user-photo-lightbox__nav--prev"
                aria-label="Предыдущее"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
              >
                ‹
              </button>
            ) : null}
            <div
              className={`user-photo-lightbox__track${dragging ? ' user-photo-lightbox__track--dragging' : ''}`}
              style={{
                transform: trackTransform,
                transition: dragging ? 'none' : 'transform 220ms ease-out',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
            >
              {photos.map((slide) => {
                const src = resolveAvatarUrl(slide.url, cacheBust);
                return (
                  <div key={slide.id} className="user-photo-lightbox__slide">
                    {src ? (
                      <img
                        src={src}
                        alt={displayName}
                        className="user-photo-lightbox__img"
                        decoding="async"
                        draggable={false}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
            {showNav && hasNext ? (
              <button
                type="button"
                className="user-photo-lightbox__nav user-photo-lightbox__nav--next"
                aria-label="Следующее"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
              >
                ›
              </button>
            ) : null}
          </>
        )}
      </div>
      <SlideActions
        photo={photo}
        displayName={displayName}
        targetUserId={targetUserId}
        currentUserId={currentUserId}
        ownerActionsBusy={ownerActionsBusy}
        onSetAsAvatar={onSetAsAvatar}
        onDeletePhoto={onDeletePhoto}
        onFocusChange={onFocusChange}
        editingFocus={editingFocus}
        onEditingFocusChange={setEditingFocus}
      />
    </div>,
    document.body,
  );
}
