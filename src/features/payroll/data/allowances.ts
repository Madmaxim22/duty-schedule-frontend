/**
 * Конфигурация надбавок по приказу Росгвардии №472 (ред. 15.10.2025)
 * Группы суммирования особых условий службы (ОУС) — п. 52–53
 */
export type OusSummationGroup =
  | 'standard'      // суммируется в общий потолок 100%
  | 'specnaz_max'   // п.52 п.6 — максимум, не сумма
  | 'special_max50' // п.52 п.13 — сумма, но ≤50%
  | 'leadership30'  // п.52 п.15 — сумма, но ≤30%
  | 'foreign20';    // п.52 п.17 — до 20%

export interface OusOption {
  id: string;
  label: string;
  percent: number;
  group: OusSummationGroup;
  appendix?: string;
  /** Фиксированный % или диапазон до maxPercent */
  maxPercent?: number;
  /** Пользователь задаёт % в диапазоне */
  variable?: boolean;
}

/** Особые условия военной службы — п. 52 */
export const OUS_OPTIONS: OusOption[] = [
  { id: 'ous_central', label: 'Центральный аппарат Росгвардии', percent: 100, group: 'standard' },
  { id: 'ous_flight_100', label: 'Лётный состав (норма налёта выполнена)', percent: 100, group: 'standard' },
  { id: 'ous_ship_50', label: 'Экипажи НК войсковой части 6942', percent: 50, group: 'standard' },
  { id: 'ous_diver_50', label: 'Водолазные работы (ч. 6942, норма спусков)', percent: 50, group: 'standard' },
  { id: 'ous_ship_20', label: 'Экипажи надводных кораблей (катеров)', percent: 20, group: 'standard' },
  { id: 'ous_diver_30', label: 'Водолазные работы (общие, норма спусков)', percent: 30, group: 'standard' },

  { id: 'ous_specnaz_70', label: 'Спецназ: боевые подразделения (70%)', percent: 70, group: 'specnaz_max', appendix: 'Прил. №2–7' },
  { id: 'ous_specnaz_60', label: 'Спецназ: подразделения обеспечения (60%)', percent: 60, group: 'specnaz_max', appendix: 'Прил. №2–7' },
  { id: 'ous_specnaz_50', label: 'Спецназ: прочие должности (50%)', percent: 50, group: 'specnaz_max', appendix: 'Прил. №2–7' },
  { id: 'ous_spec_mgmt_70', label: 'Органы управления спецчастей (70%)', percent: 70, group: 'specnaz_max', appendix: 'Прил. №2' },
  { id: 'ous_intel_mgmt', label: 'Органы управления разведкой (до 70%)', percent: 70, maxPercent: 70, group: 'specnaz_max', variable: true, appendix: 'Прил. №3' },
  { id: 'ous_parachute_30', label: 'Прыжки с парашютом (норма выполнена)', percent: 30, group: 'standard' },
  { id: 'ous_medical', label: 'Медслужба в особых условиях (до 50%)', percent: 50, maxPercent: 50, group: 'standard', variable: true, appendix: 'Прил. №4' },
  { id: 'ous_special_object', label: 'Специальные объекты (до 30%)', percent: 30, maxPercent: 30, group: 'standard', variable: true, appendix: 'Прил. №5' },
  { id: 'ous_special_work', label: 'Специальные виды работ (30%)', percent: 30, group: 'standard', appendix: 'Прил. №6' },
  { id: 'ous_special_env', label: 'Особые условия в особых условиях (до 50%)', percent: 50, maxPercent: 50, group: 'special_max50', variable: true, appendix: 'Прил. №7' },
  { id: 'ous_cus_moscow', label: 'ЦУС войск Росгвардии, подразделения в г. Москве (50%)', percent: 50, group: 'special_max50', appendix: 'Прил. №7, п. 1' },
  { id: 'ous_aviation_ground', label: 'Наземные авиационные специалисты (20%)', percent: 20, group: 'standard', appendix: 'Прил. №8' },
  /** Выбирается отдельным списком Прил. № 9, не показывается в чекбоксах */
  { id: 'ous_leadership', label: 'Руководящие должности', percent: 30, maxPercent: 30, group: 'leadership30', appendix: 'Прил. №9' },
  { id: 'ous_foreign', label: 'Применение иностранных языков (до 20%)', percent: 20, maxPercent: 20, group: 'foreign20', variable: true, appendix: 'Прил. №10' },
  { id: 'ous_moscow_spb', label: 'Москва/МО, СПб/ЛО (10%)', percent: 10, group: 'standard', appendix: 'п. 52 п. 18' },
  { id: 'ous_armored_crew', label: 'Экипажи БТ на гус./кол. шасси (20%)', percent: 20, group: 'standard' },
];

export interface ClassQualOption {
  id: string;
  label: string;
  percent: number;
}

export const CLASS_QUAL_OPTIONS: ClassQualOption[] = [
  { id: 'none', label: 'Нет', percent: 0 },
  { id: 'class3', label: '3-й класс (5%)', percent: 5 },
  { id: 'class2', label: '2-й класс / 2-я категория (10%)', percent: 10 },
  { id: 'class1', label: '1-й класс / 1-я категория (20%)', percent: 20 },
  { id: 'master', label: 'Мастер / высшая категория (30%)', percent: 30 },
];

export interface StateSecretOption {
  id: string;
  label: string;
  percent: number;
}

export const STATE_SECRET_OPTIONS: StateSecretOption[] = [
  { id: 'none', label: 'Нет', percent: 0 },
  { id: 'secret', label: '«Секретно» (10%)', percent: 10 },
  { id: 'top_secret', label: '«Совершенно секретно» (20%)', percent: 20 },
  { id: 'special_importance', label: '«Особой важности» (25%)', percent: 25 },
  { id: 'special_importance_65', label: '«Особой важности» — отдельные должности (до 65%)', percent: 65, maxPercent: 65 } as StateSecretOption & { maxPercent: number },
];

export interface AchievementOption {
  id: string;
  label: string;
  percent: number;
  /** pickOne — только одно из группы (п. 71) */
  pickOneGroup?: string;
  /** oneMonth — выплата за один месяц (п. 71 п. 23–24) */
  oneMonth?: boolean;
}

export const ACHIEVEMENT_OPTIONS: AchievementOption[] = [
  { id: 'ach_orders', label: 'Орден/высшее звание/знак отличия (50%)', percent: 50, pickOneGroup: 'honors' },
  { id: 'ach_honorary', label: 'Почётное звание (50%)', percent: 50, pickOneGroup: 'honors' },
  { id: 'ach_mvd_medal1', label: 'Медаль МВД «За заслуги в управленческой деятельности» I ст. (30%)', percent: 30 },
  { id: 'ach_mvd_medal2', label: 'Медаль МВД II ст. (20%)', percent: 20 },
  { id: 'ach_mvd_medal3', label: 'Медаль МВД III ст. (10%)', percent: 10 },
  { id: 'ach_honor_employee', label: '«Почётный сотрудник Росгвардии/МВД» (50%)', percent: 50 },
  { id: 'ach_phd', label: 'Доктор наук (30%)', percent: 30, pickOneGroup: 'degree' },
  { id: 'ach_candidate', label: 'Кандидат наук (15%)', percent: 15, pickOneGroup: 'degree' },
  { id: 'ach_voovo_prof', label: 'ВООВО: профессор (60%) / доцент (40%)', percent: 60, pickOneGroup: 'voovo' },
  { id: 'ach_sport_zms', label: 'Заслуженный мастер спорта (50%)', percent: 50, pickOneGroup: 'sport' },
  { id: 'ach_sport_msik', label: 'МС международного класса (40%)', percent: 40, pickOneGroup: 'sport' },
  { id: 'ach_sport_ms', label: 'Мастер спорта (30%)', percent: 30, pickOneGroup: 'sport' },
  { id: 'ach_gov_flights', label: 'Полёты с членами Правительства (200%, за месяц)', percent: 200, oneMonth: true },
  { id: 'ach_sniper', label: 'Снайперское подразделение спецназа (60%)', percent: 60 },
  { id: 'ach_alpinism', label: 'Инструктор-методист по альпинизму (до 60%)', percent: 60, pickOneGroup: 'alpinism' },
  { id: 'ach_maroon_beret', label: 'Право на ношение крапового beret / спецназ (30%)', percent: 30, pickOneGroup: 'beret' },
  { id: 'ach_own_security_60', label: 'Подразделения собственной безопасности (60%)', percent: 60, pickOneGroup: 'own_sec' },
  { id: 'ach_own_security_100', label: 'ГУ собственной безопасности (100%)', percent: 100, pickOneGroup: 'own_sec' },
  { id: 'ach_tariff_1_4', label: 'Должности 1–4 тарифные разряды (50%)', percent: 50 },
  { id: 'ach_driver_cde', label: 'Водитель кат. C/D/CE (30%)', percent: 30, pickOneGroup: 'driver' },
  { id: 'ach_hospital_50', label: 'Главный военный госпиталь (50%)', percent: 50 },
  { id: 'ach_vvk_50', label: 'Центр военно-врачебной экспертизы (50%)', percent: 50 },
  { id: 'ach_central_45', label: 'Зам. начальника отдела ЦА Росгвардии (45%)', percent: 45 },
  { id: 'ach_sobr_30', label: 'СОБР/ОМОН знак отличия I ст. (30%)', percent: 30, pickOneGroup: 'beret' },
  { id: 'ach_honor_gramota', label: 'Почётная грамота Росгвардии (50%, за месяц)', percent: 50, oneMonth: true },
  { id: 'ach_honor_board', label: 'Доска почёта (50%, за месяц)', percent: 50, oneMonth: true },
  { id: 'ach_fgu_6926', label: 'В/ч 6926 — экспертиза проектов (30%)', percent: 30 },
  { id: 'ach_uaz_510', label: 'Должности по Указу №510 (15%)', percent: 15 },
  { id: 'ach_vch5380', label: 'В/ч 5380 / автовзвод в/ч 3600 (30%)', percent: 30, pickOneGroup: 'driver' },
];

export interface ZgtStazhOption {
  id: string;
  label: string;
  percent: number;
}

export const ZGT_STAZH_OPTIONS: ZgtStazhOption[] = [
  { id: 'zgt_0', label: 'Менее 1 года', percent: 0 },
  { id: 'zgt_1_5', label: '1–5 лет (10%)', percent: 10 },
  { id: 'zgt_5_10', label: '5–10 лет (15%)', percent: 15 },
  { id: 'zgt_10', label: '10 лет и более (20%)', percent: 20 },
];

export interface CipherStazhOption {
  id: string;
  label: string;
  percent: number;
  networkClass: 1 | 2;
}

export const CIPHER_STAZH_OPTIONS: CipherStazhOption[] = [
  { id: 'cipher_none', label: 'Нет', percent: 0, networkClass: 1 },
  { id: 'c1_0', label: 'Сеть 1 класса: до 3 лет (15%)', percent: 15, networkClass: 1 },
  { id: 'c1_3', label: 'Сеть 1 класса: 3–6 лет (20%)', percent: 20, networkClass: 1 },
  { id: 'c1_6', label: 'Сеть 1 класса: 6+ лет (30%)', percent: 30, networkClass: 1 },
  { id: 'c2_0', label: 'Сеть 2 класса: до 3 лет (5%)', percent: 5, networkClass: 2 },
  { id: 'c2_3', label: 'Сеть 2 класса: 3–6 лет (10%)', percent: 10, networkClass: 2 },
  { id: 'c2_6', label: 'Сеть 2 класса: 6+ лет (20%)', percent: 20, networkClass: 2 },
];

export interface LegalAllowanceOption {
  id: string;
  label: string;
  maxPercent: number;
}

export const LEGAL_ALLOWANCE_OPTIONS: LegalAllowanceOption[] = [
  { id: 'legal_none', label: 'Нет', maxPercent: 0 },
  { id: 'legal_central', label: 'Юридическая служба ЦА (до 50%)', maxPercent: 50 },
  { id: 'legal_otu', label: 'Юридическая служба ОТО/ТО (до 35%)', maxPercent: 35 },
  { id: 'legal_unit', label: 'Юридическая служба в/ч (до 20%)', maxPercent: 20 },
];

export interface RiskAllowanceInput {
  /** Дней полевых занятий (п. 57), max 60% в месяц */
  fieldExerciseDays: number;
  /** Номер прыжка с парашютом в году (п. 58) */
  parachuteJumpNumber: number;
  /** Факторы усложнения прыжка (0–2) */
  parachuteComplexityFactors: number;
  /** Инструктор ПДП */
  parachuteInstructor: boolean;
  /** Мастер спорта по парашютному спорту */
  parachuteSportMaster: boolean;
  /** Дней тушения пожаров (п. 60) */
  firefightingDays: number;
  /** Дней взрывотехнических работ (п. 59) */
  explosiveWorkDays: number;
  /** Степень опасности взрывных работ: 1 | 2 | 3 */
  explosiveDangerLevel: 1 | 2 | 3;
  /** Часы водолазных работ — глубина до 6м */
  diverHoursBand1: number;
  diverHoursBand2: number;
  diverHoursBand3: number;
  diverHoursBand4: number;
  diverHoursBand5: number;
  diverHoursBand6: number;
  diverHoursBand7: number;
}

export const DEFAULT_RISK_INPUT: RiskAllowanceInput = {
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
};

/** Надбавка за риск — до 100% от оклада по должности (п. 55) */
export const RISK_MAX_PERCENT = 100;
