import { useCallback, useEffect, useRef, useState } from 'react';
import { likePhoto, unlikePhoto } from '@/shared/api/client';
import type { PhotoLikeStatus } from '@/shared/api/types';

const DEBOUNCE_MS = 400;

type ServerSnapshot = {
  liked: boolean;
  count: number;
};

type Options = {
  photoId: string | undefined;
  open: boolean;
  canLike: boolean;
  serverLiked: boolean;
  serverCount: number;
  onSynced: (status: PhotoLikeStatus) => void;
  onLikedBurst: () => void;
};

export function useDebouncedLikeSync({
  photoId,
  open,
  canLike,
  serverLiked,
  serverCount,
  onSynced,
  onLikedBurst,
}: Options) {
  const [localLiked, setLocalLiked] = useState(serverLiked);
  const serverRef = useRef<ServerSnapshot>({ liked: serverLiked, count: serverCount });
  const localLikedRef = useRef(localLiked);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncingRef = useRef(false);

  localLikedRef.current = localLiked;

  useEffect(() => {
    if (open) {
      setLocalLiked(serverLiked);
      serverRef.current = { liked: serverLiked, count: serverCount };
    }
  }, [open, photoId, serverLiked, serverCount]);

  const displayCount = Math.max(
    0,
    serverCount +
      (localLiked === serverLiked ? 0 : localLiked ? 1 : -1),
  );

  const flush = useCallback(async () => {
    if (!photoId || !canLike || syncingRef.current) return;

    const local = localLikedRef.current;
    const server = serverRef.current;
    if (local === server.liked) return;

    syncingRef.current = true;
    try {
      const data = local ? await likePhoto(photoId) : await unlikePhoto(photoId);

      serverRef.current = { liked: data.likedByMe, count: data.likeCount };
      setLocalLiked(data.likedByMe);
      onSynced(data);

      if (local && data.likedByMe) {
        onLikedBurst();
      }
    } catch {
      setLocalLiked(server.liked);
    } finally {
      syncingRef.current = false;
    }
  }, [photoId, canLike, onSynced, onLikedBurst]);

  const scheduleSync = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void flush();
    }, DEBOUNCE_MS);
  }, [flush]);

  const toggleLike = useCallback(() => {
    setLocalLiked((prev) => !prev);
    scheduleSync();
  }, [scheduleSync]);

  useEffect(() => {
    if (!open) return;

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      void flush();
    };
  }, [open, flush]);

  return { localLiked, displayCount, toggleLike };
}
