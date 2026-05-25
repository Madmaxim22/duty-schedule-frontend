import type { ChatMessage } from '@/shared/api/types';

export type ChatMessageGroup = {
  dateKey: string;
  dateLabel: string;
  messages: ChatMessage[];
};

function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (today.getTime() - day.getTime()) / 86400000;

  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Вчера';

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function groupMessagesByDate(messages: ChatMessage[]): ChatMessageGroup[] {
  const groups: ChatMessageGroup[] = [];
  let currentKey = '';

  for (const msg of messages) {
    const d = new Date(msg.createdAt);
    const key = d.toDateString();
    if (key !== currentKey) {
      groups.push({
        dateKey: key,
        dateLabel: formatDateLabel(d),
        messages: [],
      });
      currentKey = key;
    }
    groups[groups.length - 1].messages.push(msg);
  }

  return groups;
}
