/** Оклады по званиям (ПП РФ №992, приложение №3), с индексацией ×1,076 с 01.10.2025 (ПП №464) */
export interface Rank {
  id: string;
  label: string;
  salary: number;
}

export const RANKS: Rank[] = [
  { id: 'private', label: 'Рядовой / матрос', salary: 7166 },
  { id: 'efreitor', label: 'Ефрейтор / старший матрос', salary: 7881 },
  { id: 'jr_sergeant', label: 'Младший сержант / старшина 2 ст.', salary: 8601 },
  { id: 'sergeant', label: 'Сержант / старшина 1 ст.', salary: 9315 },
  { id: 'sr_sergeant', label: 'Старший сержант / главный старшина', salary: 10032 },
  { id: 'starshina', label: 'Старшина / главный корабельный старшина', salary: 10750 },
  { id: 'praporshchik', label: 'Прапорщик / мичман', salary: 11464 },
  { id: 'sr_praporshchik', label: 'Старший прапорщик / старший мичман', salary: 12181 },
  { id: 'jr_lieutenant', label: 'Младший лейтенант', salary: 13614 },
  { id: 'lieutenant', label: 'Лейтенант', salary: 14331 },
  { id: 'sr_lieutenant', label: 'Старший лейтенант', salary: 15046 },
  { id: 'captain', label: 'Капитан / капитан-лейтенант', salary: 15761 },
  { id: 'major', label: 'Майор / капитан 3 ранга', salary: 16481 },
  { id: 'lt_colonel', label: 'Подполковник / капитан 2 ранга', salary: 17196 },
  { id: 'colonel', label: 'Полковник / капитан 1 ранга', salary: 18630 },
  { id: 'gen_major', label: 'Генерал-майор / контр-адмирал', salary: 28656 },
  { id: 'gen_lt', label: 'Генерал-лейтенант / вице-адмирал', salary: 31521 },
  { id: 'gen_col', label: 'Генерал-полковник / адмирал', salary: 35820 },
  { id: 'gen_army', label: 'Генерал армии / адмирал флота', salary: 38686 },
  { id: 'marshal', label: 'Маршал Российской Федерации', salary: 42983 },
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
