/** Синхронизировать с backend chat-reactions.constants.ts */
export const CHAT_REACTION_EMOJIS = [
  '👍',
  '👎',
  '❤️',
  '🔥',
  '🥰',
  '😁',
  '😢',
  '😮',
  '😡',
  '🎉',
  '👏',
  '🙏',
  '💯',
  '✨',
  '🤔',
  '😎',
  '💩',
  '🤡',
  '👀',
  '🫡',
] as const;

/** Первая строка в оверлее (без кнопки «ещё»). */
export const CHAT_REACTION_EMOJIS_QUICK = CHAT_REACTION_EMOJIS.slice(0, 6);
export const CHAT_REACTION_EMOJIS_MORE = CHAT_REACTION_EMOJIS.slice(6);
