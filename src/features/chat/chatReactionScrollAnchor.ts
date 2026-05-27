/** Регистрируется в открытой ChatRoomView; вызывается перед обновлением реакций по WS. */
let captureHandler: ((roomId: string) => void) | null = null;

export function registerChatReactionScrollCapture(handler: (roomId: string) => void) {
  captureHandler = handler;
}

export function unregisterChatReactionScrollCapture(handler: (roomId: string) => void) {
  if (captureHandler === handler) captureHandler = null;
}

export function captureChatReactionScroll(roomId: string) {
  captureHandler?.(roomId);
}

export const CHAT_SCROLL_BOTTOM_THRESHOLD_PX = 64;

export type ChatScrollSnapshot = {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
};

export function applyChatScrollReactionCompensation(
  root: HTMLElement,
  snap: ChatScrollSnapshot,
) {
  const delta = root.scrollHeight - snap.scrollHeight;
  if (delta === 0) return;

  const distanceFromBottom =
    snap.scrollHeight - snap.scrollTop - snap.clientHeight;
  const atBottom = distanceFromBottom <= CHAT_SCROLL_BOTTOM_THRESHOLD_PX;

  if (atBottom) {
    root.scrollTop = root.scrollHeight - root.clientHeight;
  } else {
    root.scrollTop = snap.scrollTop + delta;
  }
}
