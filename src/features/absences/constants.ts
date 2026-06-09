export const ABSENCE_TYPES = [
  'Отпуск',
  'Больничный',
  'Госпитализация',
  'Командировка',
  'Учёба',
] as const;

export const ABSENCE_TYPE_OTHER = 'Другое' as const;

export type AbsenceTypePreset = (typeof ABSENCE_TYPES)[number];
