import { ACHIEVEMENT_OPTIONS } from '../data/allowances';
import { hasAutoTariffGradeAllowance, TARIFF_GRADE_ACHIEVEMENT_ID } from '../data/tariffGrades';
import type { PayrollInput } from '../types/payroll';

/** Не показываются в чекбоксах — применяются по условию (тарифный разряд 1–4) */
export const HIDDEN_ACHIEVEMENT_IDS = [TARIFF_GRADE_ACHIEVEMENT_ID] as const;

export function getVisibleAchievementOptions() {
  return ACHIEVEMENT_OPTIONS.filter((a) => !HIDDEN_ACHIEVEMENT_IDS.includes(a.id as (typeof HIDDEN_ACHIEVEMENT_IDS)[number]));
}

export function getEffectiveAchievementIds(input: PayrollInput): string[] {
  const ids = input.selectedAchievementIds.filter(
    (id) => id !== TARIFF_GRADE_ACHIEVEMENT_ID || hasAutoTariffGradeAllowance(input.tariffGrade),
  );
  if (hasAutoTariffGradeAllowance(input.tariffGrade) && !ids.includes(TARIFF_GRADE_ACHIEVEMENT_ID)) {
    ids.push(TARIFF_GRADE_ACHIEVEMENT_ID);
  }
  return ids;
}

/** pickOneGroup — в группе остаётся только выбранный пункт */
export function toggleAchievementSelection(selectedIds: string[], id: string): string[] {
  const opt = ACHIEVEMENT_OPTIONS.find((a) => a.id === id);
  if (!opt) return selectedIds;

  if (selectedIds.includes(id)) {
    return selectedIds.filter((x) => x !== id);
  }

  let next = [...selectedIds, id];
  if (opt.pickOneGroup) {
    const groupmates = ACHIEVEMENT_OPTIONS.filter(
      (a) => a.pickOneGroup === opt.pickOneGroup && a.id !== id,
    ).map((a) => a.id);
    next = next.filter((x) => !groupmates.includes(x));
  }
  return next;
}
