import { useEffect, useMemo, useState } from 'react';
import type { ChatAttachment } from '@/shared/api/types';
import {
  CHAT_ALBUM_PREVIEW_MAX,
  computeChatAlbumLayout,
  resolveAlbumPhotoSizes,
  type AlbumPhotoSize,
} from './chatAlbumLayout';
import { isImageAttachment, isVideoAttachment } from './chatAttachmentUtils';
import { ChatMessageVideoBlock } from './ChatMessageVideoBlock';

type Props = {
  attachments: ChatAttachment[];
  onOpenAttachment?: (attachmentId: string) => void;
};

async function measureAttachmentSizes(attachments: ChatAttachment[]): Promise<AlbumPhotoSize[]> {
  return Promise.all(
    attachments.map(
      (att) =>
        new Promise<AlbumPhotoSize>((resolve) => {
          if (att.width != null && att.height != null && att.width > 0 && att.height > 0) {
            resolve({ width: att.width, height: att.height });
            return;
          }
          const img = new Image();
          img.onload = () => {
            resolve({
              width: img.naturalWidth || 4,
              height: img.naturalHeight || 3,
            });
          };
          img.onerror = () => resolve({ width: 4, height: 3 });
          img.src = att.posterUrl ?? att.url;
        }),
    ),
  );
}

function ChatMessageImageAttachments({
  attachments,
  onOpenAttachment,
}: {
  attachments: ChatAttachment[];
  onOpenAttachment?: (attachmentId: string) => void;
}) {
  const needsMeasure = attachments.some((a) => !a.width || !a.height);
  const [measuredSizes, setMeasuredSizes] = useState<AlbumPhotoSize[] | null>(null);

  useEffect(() => {
    if (!needsMeasure) {
      setMeasuredSizes(null);
      return;
    }
    let cancelled = false;
    void measureAttachmentSizes(attachments).then((sizes) => {
      if (!cancelled) setMeasuredSizes(sizes);
    });
    return () => {
      cancelled = true;
    };
  }, [attachments, needsMeasure]);

  const sizes = measuredSizes ?? resolveAlbumPhotoSizes(attachments);
  const layout = useMemo(() => computeChatAlbumLayout(sizes), [sizes]);
  const isAlbum = attachments.length > 1;
  const overflowCount = layout.overflowCount ?? 0;
  const previewAttachments =
    overflowCount > 0 ? attachments.slice(0, CHAT_ALBUM_PREVIEW_MAX) : attachments;

  if (!attachments.length) return null;

  return (
    <div
      className={`chat-room__attachments${isAlbum ? ' chat-room__attachments--album' : ''}`}
      style={
        isAlbum
          ? { width: layout.width, height: layout.height }
          : { width: layout.width, maxWidth: 'min(280px, 72vw)' }
      }
    >
      {previewAttachments.map((att, index) => {
        const rect = layout.rects[index];
        const cellStyle =
          rect != null
            ? {
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
              }
            : undefined;
        const showOverflowBadge =
          overflowCount > 0 && index === CHAT_ALBUM_PREVIEW_MAX - 1;
        const ariaLabel = showOverflowBadge
          ? `Открыть альбом, ещё ${overflowCount} фото`
          : `Открыть фото: ${att.fileName}`;

        return (
          <button
            key={att.id}
            type="button"
            className={`chat-room__attachment-link${
              isAlbum ? ' chat-room__attachment-link--cell' : ''
            }`}
            style={cellStyle}
            aria-label={ariaLabel}
            onClick={(e) => {
              e.stopPropagation();
              onOpenAttachment?.(att.id);
            }}
          >
            <img
              src={att.url}
              alt=""
              className={`chat-room__attachment-img${
                isAlbum ? ' chat-room__attachment-img--cover' : ''
              }`}
              loading="lazy"
              draggable={false}
            />
            {showOverflowBadge ? (
              <span className="chat-room__attachment-overflow" aria-hidden>
                +{overflowCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function ChatMessageAttachments({ attachments, onOpenAttachment }: Props) {
  const imageAttachments = attachments.filter(isImageAttachment);
  const videoAttachments = attachments.filter(isVideoAttachment);

  if (!attachments.length) return null;

  return (
    <>
      {imageAttachments.length > 0 ? (
        <ChatMessageImageAttachments
          attachments={imageAttachments}
          onOpenAttachment={onOpenAttachment}
        />
      ) : null}
      {videoAttachments.length > 0 ? (
        <ChatMessageVideoBlock
          attachments={videoAttachments}
          onOpenAttachment={onOpenAttachment}
        />
      ) : null}
    </>
  );
}
