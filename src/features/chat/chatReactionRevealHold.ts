import type { ChatReactionSummary } from '@/shared/api/types';

const heldMessageIds = new Set<string>();
const deferredReactions = new Map<string, ChatReactionSummary[]>();

/** Не показывать блок реакций в UI до приземления анимации. */
export function holdChatReactionReveal(messageId: string): void {
  heldMessageIds.add(messageId);
  deferredReactions.delete(messageId);
}

export function isChatReactionRevealHeld(messageId: string): boolean {
  return heldMessageIds.has(messageId);
}

/** Отложить применение реакций (мутация / WS), пока идёт полёт. */
export function deferChatReactionReveal(
  messageId: string,
  reactions: ChatReactionSummary[],
): boolean {
  if (!heldMessageIds.has(messageId)) return false;
  deferredReactions.set(messageId, reactions);
  return true;
}

/** Снять удержание; вернуть отложенные реакции, если успели прийти с сервера. */
export function releaseChatReactionReveal(
  messageId: string,
): ChatReactionSummary[] | undefined {
  heldMessageIds.delete(messageId);
  const pending = deferredReactions.get(messageId);
  deferredReactions.delete(messageId);
  return pending;
}

export function cancelChatReactionRevealHold(messageId: string): void {
  heldMessageIds.delete(messageId);
  deferredReactions.delete(messageId);
}
