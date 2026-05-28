import type { ChatMessage } from '@/shared/api/types';

const HIGHLIGHT_MS = 1800;

export function highlightChatMessageRow(messageId: string): void {
  const row = document.querySelector(`[data-chat-message-id="${messageId}"]`);
  if (!row) return;
  row.classList.add('chat-room__message--highlight');
  window.setTimeout(() => row.classList.remove('chat-room__message--highlight'), HIGHLIGHT_MS);
}

/** Прокрутить ленту так, чтобы строка сообщения оказалась по центру. */
export function scrollChatMessageIntoView(messageId: string): boolean {
  const row = document.querySelector(`[data-chat-message-id="${messageId}"]`);
  if (!row) return false;
  row.scrollIntoView({ block: 'center', behavior: 'smooth' });
  highlightChatMessageRow(messageId);
  return true;
}

function waitForDomPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export type ScrollToChatMessageOptions = {
  getMessages: () => ChatMessage[];
  hasOlderPages: () => boolean;
  loadOlderPage: () => Promise<unknown>;
  maxLoads?: number;
};

/**
 * Найти сообщение в ленте (при необходимости догрузить старые страницы) и прокрутить к нему.
 */
export async function scrollToChatMessage(
  messageId: string,
  options: ScrollToChatMessageOptions,
): Promise<boolean> {
  if (options.getMessages().some((m) => m.id === messageId)) {
    await waitForDomPaint();
    if (scrollChatMessageIntoView(messageId)) return true;
  }

  const maxLoads = options.maxLoads ?? 30;
  let loads = 0;

  while (options.hasOlderPages() && loads < maxLoads) {
    loads += 1;
    await options.loadOlderPage();
    await waitForDomPaint();

    if (options.getMessages().some((m) => m.id === messageId)) {
      if (scrollChatMessageIntoView(messageId)) return true;
    }
  }

  await waitForDomPaint();
  return scrollChatMessageIntoView(messageId);
}
