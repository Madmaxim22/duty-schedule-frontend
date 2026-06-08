import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { PayrollInput } from '../types/payroll';
import { DEFAULT_INPUT } from './format';

const STORAGE_KEY = 'duty-payroll-input';

function mergePayrollInput(partial: Partial<PayrollInput>): PayrollInput {
  return {
    ...DEFAULT_INPUT,
    ...partial,
    ousCustomPercents: partial.ousCustomPercents ?? DEFAULT_INPUT.ousCustomPercents,
    selectedOusIds: partial.selectedOusIds ?? DEFAULT_INPUT.selectedOusIds,
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
    return mergePayrollInput(JSON.parse(raw) as Partial<PayrollInput>);
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
