import type { AdminActivityUser } from '@/shared/api/types';

export type ActivitySortDirection = 'asc' | 'desc';

export type ActivitySortKey =
  | 'name'
  | 'last_active'
  | 'logins'
  | 'chat_messages'
  | 'chat_attachments';

function sortValue(user: AdminActivityUser, key: ActivitySortKey): number | string {
  switch (key) {
    case 'name':
      return user.fullName;
    case 'last_active':
      return user.lastActiveAt ?? '';
    case 'logins':
      return user.loginsMonth;
    case 'chat_messages':
      return user.chatMessagesMonth;
    case 'chat_attachments':
      return user.chatAttachmentsMonth;
    default:
      return 0;
  }
}

export function sortActivityUsers(
  users: AdminActivityUser[],
  key: ActivitySortKey,
  direction: ActivitySortDirection,
): AdminActivityUser[] {
  const sorted = [...users];
  const sign = direction === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    const va = sortValue(a, key);
    const vb = sortValue(b, key);

    if (typeof va === 'string' && typeof vb === 'string') {
      if (key === 'last_active') {
        if (!va && !vb) return a.fullName.localeCompare(b.fullName, 'ru');
        if (!va) return 1;
        if (!vb) return -1;
        return sign * va.localeCompare(vb);
      }
      return sign * va.localeCompare(vb, 'ru');
    }

    const na = Number(va);
    const nb = Number(vb);
    if (na !== nb) return sign * (na - nb);
    return a.fullName.localeCompare(b.fullName, 'ru');
  });

  return sorted;
}

export const ACTIVITY_SORT_OPTIONS: Array<{
  value: ActivitySortKey;
  label: string;
}> = [
  { value: 'name', label: 'По имени' },
  { value: 'last_active', label: 'Последняя активность' },
  { value: 'logins', label: 'Входы за месяц' },
  { value: 'chat_messages', label: 'Сообщения в чате' },
  { value: 'chat_attachments', label: 'Вложения в чате' },
];
