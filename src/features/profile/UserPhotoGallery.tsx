import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AvatarPreviewModal } from '@/features/day-detail/AvatarPreviewModal';
import { UserPhotoLightbox } from '@/features/profile/UserPhotoLightbox';
import { listUserPhotos } from '@/shared/api/client';
import type { UserPhoto } from '@/shared/api/types';
import { avatarImageStyle } from '@/shared/lib/avatarFocus';
import { resolveAvatarUrl } from '@/shared/lib/avatarUrl';
import { useMediaMinMd } from '@/shared/hooks/useMediaMinMd';

type Props = {
  userId: string;
  displayName: string;
  currentUserId: string | undefined;
  enabled: boolean;
  layout?: 'stack' | 'expanded';
  sectionId?: string;
  headingId?: string;
};

export function UserPhotoGallery({
  userId,
  displayName,
  currentUserId,
  enabled,
  layout = 'stack',
  sectionId = 'user-profile-gallery-heading',
  headingId = 'user-profile-gallery-heading',
}: Props) {
  const isMinMd = useMediaMinMd();
  const useLightbox = isMinMd;
  const [previewPhoto, setPreviewPhoto] = useState<UserPhoto | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-photos', userId],
    queryFn: () => listUserPhotos(userId),
    enabled: enabled && Boolean(userId),
  });

  const photos = data?.photos ?? [];
  const previewIndex = previewPhoto ? photos.findIndex((p) => p.id === previewPhoto.id) : 0;

  const sectionClass =
    layout === 'expanded'
      ? 'profile-modal__section profile-modal__section--gallery'
      : 'profile-modal__section';

  return (
    <>
      <section className={sectionClass} aria-labelledby={headingId}>
        {layout === 'stack' ? (
          <h3 id={headingId} className="profile-modal__section-title">
            Галерея фото
          </h3>
        ) : null}
        {data?.count != null ? (
          <p className="profile-modal__section-hint">
            {data.count === 0
              ? 'Пока нет фотографий'
              : layout === 'expanded'
                ? `${data.count} фото. Нажмите на миниатюру для просмотра.`
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
          <ul className="photo-gallery" id={sectionId}>
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

      {useLightbox ? (
        <UserPhotoLightbox
          open={Boolean(previewPhoto)}
          photos={photos}
          initialIndex={previewIndex >= 0 ? previewIndex : 0}
          displayName={displayName}
          targetUserId={userId}
          currentUserId={currentUserId}
          onClose={() => setPreviewPhoto(null)}
        />
      ) : (
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
      )}
    </>
  );
}
