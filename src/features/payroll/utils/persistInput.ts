import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { TARIFF_GRADES } from '../data/tariffGrades';
import type { PayrollInput } from '../types/payroll';
import { DEFAULT_INPUT } from './format';

const STORAGE_KEY = 'duty-payroll-input';

function normalizeOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

type StoredPayrollInput = Partial<PayrollInput> & { savedPositionSalary?: number };

function migrateSavedTariffGrade(partial: StoredPayrollInput): number | undefined {
  const fromGrade = normalizeOptionalNumber(partial.savedTariffGrade);
  if (fromGrade != null) return fromGrade;

  const oldSalary = normalizeOptionalNumber(partial.savedPositionSalary);
  if (oldSalary == null) return undefined;

  return TARIFF_GRADES.find((g) => g.salary === oldSalary)?.grade;
}

function mergePayrollInput(partial: StoredPayrollInput): PayrollInput {
  const { savedPositionSalary: _legacySaved, savedTariffGrade: _savedGrade, ...rest } = partial;

  return {
    ...DEFAULT_INPUT,
    ...rest,
    savedTariffGrade: migrateSavedTariffGrade(partial),
    actingTariffGrade: normalizeOptionalNumber(partial.actingTariffGrade),
    ousCustomPercents: partial.ousCustomPercents ?? DEFAULT_INPUT.ousCustomPercents,
    selectedOusIds: partial.selectedOusIds ?? DEFAULT_INPUT.selectedOusIds,
    leadershipPositionId: partial.leadershipPositionId,
    selectedAchievementIds: partial.selectedAchievementIds ?? DEFAULT_INPUT.selectedAchievementIds,
    risk: {
      ...DEFAULT_INPUT.risk,
      ...partial.risk,
    },
  };
}

export function loadPayrollInput(): PayrollInput {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INPUT;
    return mergePayrollInput(JSON.parse(raw) as StoredPayrollInput);
  } catch {
    return DEFAULT_INPUT;
  }
}

export function savePayrollInput(input: PayrollInput): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  } catch {
    // localStorage недоступен или переполнен
  }
}

export function usePersistedPayrollInput(): [
  PayrollInput,
  Dispatch<SetStateAction<PayrollInput>>,
] {
  const [input, setInput] = useState(loadPayrollInput);

  useEffect(() => {
    savePayrollInput(input);
  }, [input]);

  return [input, setInput];
}
