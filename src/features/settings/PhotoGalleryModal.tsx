import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { AvatarPreviewModal } from '@/features/day-detail/AvatarPreviewModal';
import {
  deletePhoto,
  listMyPhotos,
  setCurrentPhoto,
  updatePhotoFocus,
  uploadPhoto,
} from '@/shared/api/client';
import type { UserPhoto } from '@/shared/api/types';
import { avatarImageStyle } from '@/shared/lib/avatarFocus';
import { resolveAvatarUrl } from '@/shared/lib/avatarUrl';
import { Modal } from '@/shared/ui/Modal';

type Props = {
  open: boolean;
  displayName: string;
  onClose: () => void;
  onUserUpdated: () => void;
};

export function PhotoGalleryModal({ open, displayName, onClose, onUserUpdated }: Props) {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewPhoto, setPreviewPhoto] = useState<UserPhoto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cacheBust, setCacheBust] = useState(0);
  const focusSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-photos'],
    queryFn: listMyPhotos,
    enabled: open,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['my-photos'] });
  };

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadPhoto(file, true),
    onSuccess: (result) => {
      setError(null);
      setCacheBust(Date.now());
      setUser(result.user);
      onUserUpdated();
      invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePhoto,
    onSuccess: (result) => {
      setError(null);
      setCacheBust(Date.now());
      setUser(result.user);
      onUserUpdated();
      setPreviewPhoto(null);
      invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const setCurrentMutation = useMutation({
    mutationFn: setCurrentPhoto,
    onSuccess: (result) => {
      setError(null);
      setCacheBust(Date.now());
      setUser(result.user);
      onUserUpdated();
      setPreviewPhoto((prev) =>
        prev ? { ...prev, isCurrent: prev.id === result.user.currentPhotoId } : null,
      );
      invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const focusMutation = useMutation({
    mutationFn: ({ photoId, focusX, focusY }: { photoId: string; focusX: number; focusY: number }) =>
      updatePhotoFocus(photoId, focusX, focusY),
    onSuccess: (result) => {
      setError(null);
      setCacheBust(Date.now());
      setUser(result.user);
      onUserUpdated();
      setPreviewPhoto(result.photo);
      invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  useEffect(
    () => () => {
      if (focusSaveTimerRef.current) clearTimeout(focusSaveTimerRef.current);
    },
    [],
  );

  const busy =
    uploadMutation.isPending ||
    deleteMutation.isPending ||
    setCurrentMutation.isPending ||
    focusMutation.isPending;

  const photos = data?.photos ?? [];
  const atLimit = (data?.count ?? 0) >= (data?.maxPhotos ?? 20);

  function openPicker() {
    if (busy || atLimit) return;
    setError(null);
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    uploadMutation.mutate(file);
  }

  function handleDeleteFromPreview() {
    if (!previewPhoto || busy) return;
    if (!window.confirm('Удалить это фото из галереи?')) return;
    deleteMutation.mutate(previewPhoto.id);
  }

  function handleSetCurrentFromPreview() {
    if (!previewPhoto || busy || previewPhoto.isCurrent) return;
    setCurrentMutation.mutate(previewPhoto.id);
  }

  function handleFocusChange(focusX: number, focusY: number) {
    if (!previewPhoto || busy) return;
    setPreviewPhoto((prev) => (prev ? { ...prev, focusX, focusY } : null));
    if (focusSaveTimerRef.current) clearTimeout(focusSaveTimerRef.current);
    focusSaveTimerRef.current = setTimeout(() => {
      focusMutation.mutate({ photoId: previewPhoto.id, focusX, focusY });
    }, 400);
  }

  function handleModalClose() {
    if (previewPhoto) return;
    onClose();
  }

  const previewInGallery = previewPhoto
    ? photos.find((p) => p.id === previewPhoto.id) ?? previewPhoto
    : null;

  return (
    <>
      <Modal
        open={open && !previewPhoto}
        title="Галерея фото"
        onClose={handleModalClose}
      >
        <div className="photo-gallery-modal">
          <p className="photo-gallery-modal__hint">
            До {data?.maxPhotos ?? 20} фотографий, до 15 МБ каждая. Нажмите на миниатюру для
            просмотра и настройки кадра.
            {data?.count != null ? ` Загружено: ${data.count}.` : ''}
          </p>

          {isLoading ? <p className="photo-gallery-modal__status">Загрузка галереи…</p> : null}

          {!isLoading && photos.length > 0 ? (
            <ul className="photo-gallery">
              {photos.map((photo) => {
                const src = resolveAvatarUrl(photo.url, cacheBust);
                return (
                  <li
                    key={photo.id}
                    className={`photo-gallery__item${photo.isCurrent ? ' photo-gallery__item--current' : ''}`}
                  >
                    <button
                      type="button"
                      className="photo-gallery__thumb-btn"
                      aria-label={`Открыть фото: ${displayName}`}
                      onClick={() => setPreviewPhoto(photo)}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt=""
                          className="photo-gallery__thumb"
                          style={avatarImageStyle(photo.focusX, photo.focusY)}
                        />
                      ) : (
                        <span className="photo-gallery__thumb-placeholder" />
                      )}
                      {photo.isCurrent ? (
                        <span className="photo-gallery__badge">Аватар</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {!isLoading && photos.length === 0 ? (
            <p className="photo-gallery-modal__status">Пока нет фотографий</p>
          ) : null}

          <button
            type="button"
            className="profile-modal__action-btn photo-gallery-modal__add"
            disabled={busy || atLimit}
            onClick={openPicker}
          >
            {atLimit ? 'Лимит фотографий (20)' : 'Добавить в галерею'}
          </button>

          {error ? (
            <p className="form-message form-message--error profile-modal__error" role="alert">
              {error}
            </p>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="visually-hidden"
            onChange={handleFileChange}
          />
        </div>
      </Modal>

      <AvatarPreviewModal
        open={Boolean(previewPhoto)}
        photoId={previewInGallery?.id}
        targetUserId={user?.id}
        currentUserId={user?.id}
        fullName={displayName}
        avatarUrl={previewInGallery?.url ?? null}
        focusX={previewInGallery?.focusX}
        focusY={previewInGallery?.focusY}
        avatarCacheBust={cacheBust}
        isCurrentPhoto={previewInGallery?.isCurrent ?? false}
        ownerActionsBusy={busy}
        onSetAsAvatar={handleSetCurrentFromPreview}
        onDeletePhoto={handleDeleteFromPreview}
        onFocusChange={handleFocusChange}
        onClose={() => setPreviewPhoto(null)}
      />
    </>
  );
}
