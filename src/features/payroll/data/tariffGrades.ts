/** Тарифные разряды 1–50 (ПП РФ №992), индексация ×1,076 с 01.10.2025 */
export interface TariffGrade {
  grade: number;
  salary: number;
  examples: string;
}

export const TARIFF_GRADES: TariffGrade[] = [
  { grade: 1, salary: 14330, examples: 'Стрелок, маскировщик, дорожник' },
  { grade: 2, salary: 15761, examples: 'Пулемётчик, снайпер' },
  { grade: 3, salary: 17196, examples: 'Старший сапёр, старший гранатомётчик' },
  { grade: 4, salary: 18629, examples: 'Командир танка, начальник автодрома' },
  { grade: 5, salary: 21495, examples: 'Командир отделения (МС/ТВ)' },
  { grade: 6, salary: 22926, examples: 'Фельдшер, начальник полигона' },
  { grade: 7, salary: 24359, examples: 'Заместитель командира взвода' },
  { grade: 8, salary: 25076, examples: 'Переводчик, пом. дежурного КП' },
  { grade: 9, salary: 25791, examples: 'Старшина роты/батальона' },
  { grade: 10, salary: 28655, examples: 'Командир взвода, начальник мед. пункта' },
  { grade: 11, salary: 29369, examples: 'Старший офицер штаба роты' },
  { grade: 12, salary: 30090, examples: 'Зам. командира роты по вооружению' },
  { grade: 13, salary: 30805, examples: 'Начальник штаба роты' },
  { grade: 14, salary: 31520, examples: 'Командир роты (младший состав)' },
  { grade: 15, salary: 32238, examples: 'Зам. командира батальона' },
  { grade: 16, salary: 32954, examples: 'Начальник штаба батальона' },
  { grade: 17, salary: 33670, examples: 'Командир батальона (мл. офицеры)' },
  { grade: 18, salary: 34388, examples: 'Начальник отдела (ОК)' },
  { grade: 19, salary: 35082, examples: 'Зам. начальника отдела (ОК)' },
  { grade: 20, salary: 35799, examples: 'Начальник отделения (штаб ОК)' },
  { grade: 21, salary: 36516, examples: 'Старший офицер (штаб ОК)' },
  { grade: 22, salary: 37251, examples: 'Офицер (штаб ОК)' },
  { grade: 23, salary: 37970, examples: 'Зам. командира полка' },
  { grade: 24, salary: 38685, examples: 'Начальник штаба полка' },
  { grade: 25, salary: 39400, examples: 'Зам. командира бригады' },
  { grade: 26, salary: 40118, examples: 'Начальник штаба бригады' },
  { grade: 27, salary: 40834, examples: 'Командир батальона (офицеры)' },
  { grade: 28, salary: 41549, examples: 'Зам. командира полка (старшие)' },
  { grade: 29, salary: 42266, examples: 'Начальник отдела (ОК старшие)' },
  { grade: 30, salary: 42983, examples: 'Командир полка' },
  { grade: 31, salary: 43697, examples: 'Зам. командира бригады (старшие)' },
  { grade: 32, salary: 44415, examples: 'Начальник управления (ОК)' },
  { grade: 33, salary: 45132, examples: 'Зам. начальника управления' },
  { grade: 34, salary: 45848, examples: 'Начальник отдела (управление)' },
  { grade: 35, salary: 46565, examples: 'Командир бригады' },
  { grade: 36, salary: 47280, examples: 'Зам. командира соединения' },
  { grade: 37, salary: 47997, examples: 'Начальник штаба соединения' },
  { grade: 38, salary: 48713, examples: 'Командир полка (старшие офицеры)' },
  { grade: 39, salary: 49429, examples: 'Начальник управления (старшие)' },
  { grade: 40, salary: 50146, examples: 'Зам. командира дивизии' },
  { grade: 41, salary: 50863, examples: 'Начальник штаба дивизии' },
  { grade: 42, salary: 51578, examples: 'Командир бригады (старшие)' },
  { grade: 43, salary: 52295, examples: 'Командир соединения' },
  { grade: 44, salary: 53011, examples: 'Зам. командующего округом' },
  { grade: 45, salary: 53727, examples: 'Начальник штаба округа' },
  { grade: 46, salary: 54443, examples: 'Командир дивизии' },
  { grade: 47, salary: 57288, examples: 'Зам. директора Росгвардии' },
  { grade: 48, salary: 60175, examples: 'Первый зам. директора Росгвардии' },
  { grade: 49, salary: 63019, examples: 'Командующий округом' },
  { grade: 50, salary: 64473, examples: 'Зам. директора (высшие должности)' },
];

/** Оклад командира стрелкового взвода (10 тарифный разряд) — база для надбавки за риск, п. 56–60 */
export const PLATOON_COMMANDER_SALARY = TARIFF_GRADES.find((g) => g.grade === 10)!.salary;

export function getTariffSalary(grade: number): number {
  return TARIFF_GRADES.find((g) => g.grade === grade)?.salary ?? 0;
}
