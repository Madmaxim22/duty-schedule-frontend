import type { PayrollInput } from '../types/payroll';

export function formatRub(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const DEFAULT_INPUT: PayrollInput = {
  rankId: 'sergeant',
  tariffGrade: 5,
  seniorityYears: 5,
  classQualId: 'none',
  stateSecretId: 'none',
  selectedOusIds: [],
  ousCustomPercents: {},
  selectedAchievementIds: [],
  zgtStazhId: 'zgt_0',
  cipherStazhId: 'cipher_none',
  legalAllowanceId: 'legal_none',
  regionalZoneId: 'none',
  risk: {
    fieldExerciseDays: 0,
    parachuteJumpNumber: 0,
    parachuteComplexityFactors: 0,
    parachuteInstructor: false,
    parachuteSportMaster: false,
    firefightingDays: 0,
    explosiveWorkDays: 0,
    explosiveDangerLevel: 3,
    diverHoursBand1: 0,
    diverHoursBand2: 0,
    diverHoursBand3: 0,
    diverHoursBand4: 0,
    diverHoursBand5: 0,
    diverHoursBand6: 0,
    diverHoursBand7: 0,
  },
  fullPremium: true,
};
