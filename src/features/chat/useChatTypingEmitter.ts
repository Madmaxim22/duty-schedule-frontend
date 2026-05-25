import { useEffect, useRef } from 'react';
import { useChatSocket } from './ChatSocketContext';

const TYPING_THROTTLE_MS = 2000;
const TYPING_IDLE_MS = 3000;

/** Отправляет typing.start/stop по WebSocket при вводе в поле сообщения. */
export function useChatTypingEmitter(roomId: string, draft: string) {
  const { sendTyping } = useChatSocket();
  const activeRef = useRef(false);
  const lastSentRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTyping = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (!activeRef.current) return;
    activeRef.current = false;
    sendTyping(roomId, false);
  };

  const startTyping = () => {
    const now = Date.now();
    if (!activeRef.current || now - lastSentRef.current >= TYPING_THROTTLE_MS) {
      activeRef.current = true;
      lastSentRef.current = now;
      sendTyping(roomId, true);
    }
  };

  useEffect(() => {
    return () => {
      stopTyping();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    if (!draft.trim()) {
      stopTyping();
      return;
    }

    startTyping();

    idleTimerRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_IDLE_MS);

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, roomId]);
}
