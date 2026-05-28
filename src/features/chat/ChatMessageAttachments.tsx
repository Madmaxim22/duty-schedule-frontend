import { useEffect, useMemo, useState } from 'react';
import type { ChatAttachment } from '@/shared/api/types';
import {
  computeChatAlbumLayout,
  resolveAlbumPhotoSizes,
  type AlbumPhotoSize,
} from './chatAlbumLayout';

type Props = {
  attachments: ChatAttachment[];
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
          img.src = att.url;
        }),
    ),
  );
}

export function ChatMessageAttachments({ attachments }: Props) {
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
      {attachments.map((att, index) => {
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

        return (
          <a
            key={att.id}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`chat-room__attachment-link${
              isAlbum ? ' chat-room__attachment-link--cell' : ''
            }`}
            style={cellStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={att.url}
              alt={att.fileName}
              className={`chat-room__attachment-img${
                isAlbum ? ' chat-room__attachment-img--cover' : ''
              }`}
              loading="lazy"
            />
          </a>
        );
      })}
    </div>
  );
}
