import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ChatMediaGalleryItem } from './buildChatRoomMediaGallery';

const SWIPE_THRESHOLD_PX = 48;

type Props = {
  open: boolean;
  items: ChatMediaGalleryItem[];
  initialIndex: number;
  onClose: () => void;
};

function formatGalleryMeta(createdAt: string) {
  return new Date(createdAt).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function preloadImage(url: string) {
  const img = new Image();
  img.src = url;
}

export function ChatMediaLightbox({ open, items, initialIndex, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointerStartX = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    if (open) setActiveIndex(initialIndex);
  }, [open, initialIndex]);

  const item = items[activeIndex];
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < items.length - 1;
  const showNav = items.length > 1;

  const goPrev = useCallback(() => {
    setActiveIndex((i) => Math.max(0, i - 1));
    setDragOffset(0);
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((i) => Math.min(items.length - 1, i + 1));
    setDragOffset(0);
  }, [items.length]);

  useEffect(() => {
    if (!open || !item) return;
    const prevItem = hasPrev ? items[activeIndex - 1] : null;
    const nextItem = hasNext ? items[activeIndex + 1] : null;
    if (prevItem?.kind === 'image') preloadImage(prevItem.url);
    if (nextItem?.kind === 'image') preloadImage(nextItem.url);
  }, [open, activeIndex, item, hasPrev, hasNext, items]);

  useEffect(() => {
    if (!open) return;
    for (const [id, video] of videoRefs.current.entries()) {
      const slide = items.find((entry) => entry.attachmentId === id);
      if (!slide || slide.attachmentId !== item?.attachmentId) {
        video.pause();
        video.currentTime = 0;
      }
    }
  }, [open, activeIndex, item, items]);

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
    if (!showNav || e.button !== 0) return;
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

  if (!open || !item || items.length === 0) return null;

  const trackTransform = `translateX(calc(${-activeIndex * 100}% + ${dragOffset}px))`;

  return createPortal(
    <div
      className="chat-media-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр медиа"
    >
      <button
        type="button"
        className="chat-media-lightbox__backdrop"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <header className="chat-media-lightbox__header">
        <div className="chat-media-lightbox__meta">
          <span className="chat-media-lightbox__author">{item.authorName}</span>
          <time className="chat-media-lightbox__time" dateTime={item.createdAt}>
            {formatGalleryMeta(item.createdAt)}
          </time>
        </div>
        {showNav ? (
          <span className="chat-media-lightbox__counter" aria-live="polite">
            {activeIndex + 1} / {items.length}
          </span>
        ) : null}
        <button
          type="button"
          className="chat-media-lightbox__close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>
      </header>
      <div
        ref={viewportRef}
        className={`chat-media-lightbox__viewport${dragging ? ' chat-media-lightbox__viewport--dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {showNav && hasPrev ? (
          <button
            type="button"
            className="chat-media-lightbox__nav chat-media-lightbox__nav--prev"
            aria-label="Предыдущее"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
          >
            ‹
          </button>
        ) : null}
        <div
          className="chat-media-lightbox__track"
          style={{
            transform: trackTransform,
            transition: dragging ? 'none' : 'transform 220ms ease-out',
          }}
        >
          {items.map((slide) => (
            <div key={slide.attachmentId} className="chat-media-lightbox__slide">
              {slide.kind === 'video' ? (
                <video
                  ref={(node) => {
                    if (node) videoRefs.current.set(slide.attachmentId, node);
                    else videoRefs.current.delete(slide.attachmentId);
                  }}
                  src={slide.url}
                  poster={slide.posterUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="chat-media-lightbox__video"
                />
              ) : (
                <img
                  src={slide.url}
                  alt={slide.fileName}
                  className="chat-media-lightbox__img"
                  decoding="async"
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>
        {showNav && hasNext ? (
          <button
            type="button"
            className="chat-media-lightbox__nav chat-media-lightbox__nav--next"
            aria-label="Следующее"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
          >
            ›
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
