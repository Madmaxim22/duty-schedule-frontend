/** Оклады по званиям (ПП РФ №992, приложение №3), с индексацией ×1,076 с 01.10.2025 (ПП №464) */
export interface Rank {
  id: string;
  label: string;
  salary: number;
}

export const RANKS: Rank[] = [
  { id: 'private', label: 'Рядовой / матрос', salary: 7165 },
  { id: 'efreitor', label: 'Ефрейтор / старший матрос', salary: 7879 },
  { id: 'jr_sergeant', label: 'Младший сержант / старшина 2 ст.', salary: 8600 },
  { id: 'sergeant', label: 'Сержант / старшина 1 ст.', salary: 9315 },
  { id: 'sr_sergeant', label: 'Старший сержант / главный старшина', salary: 10034 },
  { id: 'starshina', label: 'Старшина / главный корабельный старшина', salary: 10752 },
  { id: 'praporshchik', label: 'Прапорщик / мичман', salary: 11468 },
  { id: 'sr_praporshchik', label: 'Старший прапорщик / старший мичман', salary: 12187 },
  { id: 'jr_lieutenant', label: 'Младший лейтенант', salary: 13618 },
  { id: 'lieutenant', label: 'Лейтенант', salary: 14337 },
  { id: 'sr_lieutenant', label: 'Старший лейтенант', salary: 15055 },
  { id: 'captain', label: 'Капитан / капитан-лейтенант', salary: 15772 },
  { id: 'major', label: 'Мajor / капитан 3 ранга', salary: 16492 },
  { id: 'lt_colonel', label: 'Подполковник / капитан 2 ранга', salary: 17208 },
  { id: 'colonel', label: 'Полковник / капитан 1 ранга', salary: 18644 },
  { id: 'gen_major', label: 'Генерал-майор / контр-адмирал', salary: 28690 },
  { id: 'gen_lt', label: 'Генерал-лейтенант / вице-адмирал', salary: 31575 },
  { id: 'gen_col', label: 'Генерал-полковник / адмирал', salary: 34799 },
  { id: 'gen_army', label: 'Генерал армии / адмирал флота', salary: 37559 },
  { id: 'marshal', label: 'Маршал Российской Федерации', salary: 41715 },
];

export const SENIORITY_RATES: { minYears: number; percent: number; label: string }[] = [
  { minYears: 25, percent: 40, label: '25 лет и более' },
  { minYears: 20, percent: 30, label: '20–25 лет' },
  { minYears: 15, percent: 25, label: '15–20 лет' },
  { minYears: 10, percent: 20, label: '10–15 лет' },
  { minYears: 5, percent: 15, label: '5–10 лет' },
  { minYears: 2, percent: 10, label: '2–5 лет' },
  { minYears: 0, percent: 0, label: 'Менее 2 лет' },
];

export function getSeniorityPercent(years: number): number {
  for (const tier of SENIORITY_RATES) {
    if (years >= tier.minYears) return tier.percent;
  }
  return 0;
}
