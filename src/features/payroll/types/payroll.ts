import type { RiskAllowanceInput } from '../data/allowances';
import type { RegionalZone } from '../data/regionalCoeffs';

export interface PayrollInput {
  rankId: string;
  tariffGrade: number;
  /** Сохранённый оклад по должности (п. 25) — если выше текущего */
  savedPositionSalary?: number;
  /** Временно исполняемая вакантная должность — другой тарифный разряд */
  actingTariffGrade?: number;
  seniorityYears: number;
  classQualId: string;
  stateSecretId: string;
  /** Для variable надбавок — пользовательский % */
  stateSecretCustomPercent?: number;
  selectedOusIds: string[];
  ousCustomPercents: Record<string, number>;
  selectedAchievementIds: string[];
  zgtStazhId: string;
  cipherStazhId: string;
  legalAllowanceId: string;
  legalCustomPercent?: number;
  regionalZoneId: string;
  customRegional?: Partial<RegionalZone>;
  risk: RiskAllowanceInput;
  /** Премия: true = 25%, false = 5% (дисциплинарка) */
  fullPremium: boolean;
  /** Дней в месяце для пропорционального расчёта (п. 11), 0 = полный месяц */
  daysWorked?: number;
  daysInMonth?: number;
  /** Надбавка за риск (общая) — ручной % до 100%, если не детализирована */
  manualRiskPercent?: number;
}

export interface PayrollLineItem {
  id: string;
  label: string;
  base: number;
  percent?: number;
  amount: number;
  note?: string;
  legalRef?: string;
}

export interface PayrollResult {
  rankSalary: number;
  positionSalary: number;
  ods: number;
  regionalCoeff: number;
  regionalSeniorityPercent: number;
  lines: PayrollLineItem[];
  subtotalBeforePremium: number;
  premium: number;
  /** Начислено до удержаний */
  totalMonthly: number;
  /** НДФЛ, удерживаемый государством */
  ndfl: number;
  ndflPercent: number;
  /** К выплате «на руки» после НДФЛ */
  netMonthly: number;
  /** Ежегодная материальная помощь, начислено (п. 81, = ОДС) */
  annualMaterialAid: number;
  /** НДФЛ с ежегодной матпомощи */
  annualMaterialAidNdfl: number;
  /** Ежегодная матпомощь к выплате «на руки» */
  annualMaterialAidNet: number;
  warnings: string[];
}

export interface AllowanceContext {
  rankSalary: number;
  positionSalary: number;
  ods: number;
  platoonCommanderSalary: number;
  regionalCoeff: number;
  regionalSeniorityPercent: number;
}
