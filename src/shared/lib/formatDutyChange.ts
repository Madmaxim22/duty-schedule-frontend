import type { DutyAssignmentChangeItem } from '@/shared/api/types';
import { formatSurnameWithInitials } from '@/shared/lib/formatName';

function personName(user: { fullName: string } | null): string {
  if (!user) return '—';
  return formatSurnameWithInitials(user.fullName);
}

export function formatDutyChangeDescription(change: DutyAssignmentChangeItem): string {
  const slot = `каб. ${change.office}, ${formatDutyDate(change.dutyDate)}`;
  switch (change.changeType) {
    case 'assigned':
      return `Назначен: ${personName(change.newUser)} — ${slot}`;
    case 'removed':
      return `Снят: ${personName(change.previousUser)} — ${slot}`;
    case 'replaced':
      return `${personName(change.previousUser)} → ${personName(change.newUser)} — ${slot}`;
    default:
      return slot;
  }
}

export function formatDutyDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatChangeSource(source: DutyAssignmentChangeItem['source']): string {
  if (source === 'import') return 'Импорт';
  if (source === 'swap') return 'Смена';
  if (source === 'absence') return 'Отсутствие';
  return 'Вручную';
}
