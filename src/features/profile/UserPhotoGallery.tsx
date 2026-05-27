import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AvatarPreviewModal } from '@/features/day-detail/AvatarPreviewModal';
import { listUserPhotos } from '@/shared/api/client';
import type { UserPhoto } from '@/shared/api/types';
import { avatarImageStyle } from '@/shared/lib/avatarFocus';
import { resolveAvatarUrl } from '@/shared/lib/avatarUrl';

type Props = {
  userId: string;
  displayName: string;
  currentUserId: string | undefined;
  enabled: boolean;
};

export function UserPhotoGallery({ userId, displayName, currentUserId, enabled }: Props) {
  const [previewPhoto, setPreviewPhoto] = useState<UserPhoto | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-photos', userId],
    queryFn: () => listUserPhotos(userId),
    enabled: enabled && Boolean(userId),
  });

  const photos = data?.photos ?? [];

  return (
    <>
      <section className="profile-modal__section" aria-labelledby="user-profile-gallery-heading">
        <h3 id="user-profile-gallery-heading" className="profile-modal__section-title">
          Галерея фото
        </h3>
        {data?.count != null ? (
          <p className="profile-modal__section-hint">
            {data.count === 0
              ? 'Пока нет фотографий'
              : `Фотографий: ${data.count}. Нажмите на миниатюру для просмотра.`}
          </p>
        ) : null}

        {isLoading ? <p className="photo-gallery-modal__status">Загрузка галереи…</p> : null}
        {error ? (
          <p className="form-message form-message--error" role="alert">
            {(error as Error).message}
          </p>
        ) : null}

        {!isLoading && !error && photos.length > 0 ? (
          <ul className="photo-gallery">
            {photos.map((photo) => {
              const src = resolveAvatarUrl(photo.url);
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
      </section>

      <AvatarPreviewModal
        open={Boolean(previewPhoto)}
        photoId={previewPhoto?.id}
        targetUserId={userId}
        currentUserId={currentUserId}
        fullName={displayName}
        avatarUrl={previewPhoto?.url ?? null}
        focusX={previewPhoto?.focusX}
        focusY={previewPhoto?.focusY}
        isCurrentPhoto={previewPhoto?.isCurrent ?? false}
        onClose={() => setPreviewPhoto(null)}
      />
    </>
  );
}
