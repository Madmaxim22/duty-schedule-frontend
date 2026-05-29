import type { ChatDeleteMessageMode, ChatMessage, ChatRoomMember } from '@/shared/api/types';

export type ChatMessageMenuContext = {
  message: ChatMessage;
  isMine: boolean;
  isDirect: boolean;
  peerLastReadAt: string | null | undefined;
};

export type ChatMessageMenuActionId =
  | 'read'
  | 'reply'
  | 'copy'
  | 'forward'
  | 'pin'
  | 'edit'
  | 'deleteEveryone'
  | 'deleteMe';

export type ChatMessageMenuAction = {
  id: ChatMessageMenuActionId;
  label: string;
  danger?: boolean;
  hidden?: boolean;
};

function formatReadTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildChatMessageMenuActions(ctx: ChatMessageMenuContext): ChatMessageMenuAction[] {
  const showRead =
    ctx.isMine &&
    ctx.isDirect &&
    ctx.message.status === 'read' &&
    Boolean(ctx.peerLastReadAt);

  const readLabel = showRead
    ? `Прочитано в ${formatReadTime(ctx.peerLastReadAt!)}`
    : ctx.isMine && ctx.isDirect
      ? 'Ещё не прочитано'
      : '';

  const isDeleted = Boolean(ctx.message.deleted);

  return [
    {
      id: 'read',
      label: readLabel,
      hidden: !ctx.isMine || !ctx.isDirect,
    },
    { id: 'reply', label: 'Ответить', hidden: isDeleted },
    { id: 'copy', label: 'Копировать', hidden: isDeleted },
    { id: 'forward', label: 'Переслать' },
    { id: 'pin', label: 'Закрепить' },
    { id: 'edit', label: 'Изменить', hidden: !ctx.isMine || isDeleted },
    {
      id: 'deleteEveryone',
      label: 'Удалить у всех',
      danger: true,
      hidden: !ctx.isMine || isDeleted,
    },
    { id: 'deleteMe', label: 'Удалить у меня', danger: true },
  ];
}

export async function runChatMessageMenuAction(
  actionId: ChatMessageMenuActionId,
  ctx: ChatMessageMenuContext,
  onStub: (message: string) => void,
  onClose: () => void,
  onReply?: (message: ChatMessage) => void,
  onRequestDelete?: (mode: ChatDeleteMessageMode) => void,
): Promise<void> {
  switch (actionId) {
    case 'copy': {
      try {
        await navigator.clipboard.writeText(ctx.message.body);
        onStub('Скопировано');
      } catch {
        onStub('Не удалось скопировать');
      }
      onClose();
      return;
    }
    case 'reply': {
      onReply?.(ctx.message);
      onClose();
      return;
    }
    case 'deleteEveryone': {
      onRequestDelete?.('everyone');
      onClose();
      return;
    }
    case 'deleteMe': {
      onRequestDelete?.('me');
      onClose();
      return;
    }
    case 'read':
      onClose();
      return;
    default:
      onStub('Скоро');
      onClose();
  }
}

export function getDirectPeerLastReadAt(
  members: ChatRoomMember[] | undefined,
  myUserId: string | undefined,
): string | null | undefined {
  if (!members || !myUserId) return null;
  const peer = members.find((m) => m.id !== myUserId);
  return peer?.lastReadAt ?? null;
}
