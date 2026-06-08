/** Районные коэффициенты и % надбавки (ПП РФ №58 от 23.01.2023) — основные группы */
export interface RegionalZone {
  id: string;
  label: string;
  /** Краткая подпись для выпадающего списка на узких экранах */
  shortLabel?: string;
  districtCoeff: number;
  /** Процентная надбавка за стаж в районе (0–100) */
  seniorityPercent: number;
  /** Высокогорный коэффициент (1 = нет) */
  highlandCoeff: number;
  /** Пустынный/безводный коэффициент (1 = нет) */
  desertCoeff: number;
}

export const REGIONAL_ZONES: RegionalZone[] = [
  { id: 'none', label: 'Обычная местность (без РК)', shortLabel: 'Без РК', districtCoeff: 1, seniorityPercent: 0, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'moscow', label: 'Москва и Московская область', shortLabel: 'Москва и МО', districtCoeff: 1, seniorityPercent: 0, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'spb', label: 'Санкт-Петербург и Ленинградская область', shortLabel: 'СПб и ЛО', districtCoeff: 1, seniorityPercent: 0, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'south_1.1', label: 'Южные районы (РК 1,1)', shortLabel: 'Юг РК 1,1', districtCoeff: 1.1, seniorityPercent: 0, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'south_1.15', label: 'Южные районы (РК 1,15)', shortLabel: 'Юг РК 1,15', districtCoeff: 1.15, seniorityPercent: 0, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'south_1.2', label: 'Южные районы (РК 1,2)', shortLabel: 'Юг РК 1,2', districtCoeff: 1.2, seniorityPercent: 10, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'south_1.3', label: 'Южные районы (РК 1,3)', shortLabel: 'Юг РК 1,3', districtCoeff: 1.3, seniorityPercent: 20, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'far_east_1.4', label: 'Дальний Восток (РК 1,4)', shortLabel: 'ДВ РК 1,4', districtCoeff: 1.4, seniorityPercent: 30, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'far_east_1.5', label: 'Дальний Восток (РК 1,5)', shortLabel: 'ДВ РК 1,5', districtCoeff: 1.5, seniorityPercent: 30, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'far_east_1.6', label: 'Дальний Восток (РК 1,6)', shortLabel: 'ДВ РК 1,6', districtCoeff: 1.6, seniorityPercent: 30, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'far_east_1.7', label: 'Дальний Восток (РК 1,7)', shortLabel: 'ДВ РК 1,7', districtCoeff: 1.7, seniorityPercent: 30, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'far_east_1.8', label: 'Дальний Восток (РК 1,8)', shortLabel: 'ДВ РК 1,8', districtCoeff: 1.8, seniorityPercent: 30, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'far_east_2.0', label: 'Дальний Восток (РК 2,0)', shortLabel: 'ДВ РК 2,0', districtCoeff: 2.0, seniorityPercent: 30, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'north_1.4', label: 'Районы Крайнего Севера (РК 1,4)', shortLabel: 'КС РК 1,4', districtCoeff: 1.4, seniorityPercent: 10, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'north_1.5', label: 'Районы Крайнего Севера (РК 1,5)', shortLabel: 'КС РК 1,5', districtCoeff: 1.5, seniorityPercent: 20, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'north_1.6', label: 'Районы Крайнего Севера (РК 1,6)', shortLabel: 'КС РК 1,6', districtCoeff: 1.6, seniorityPercent: 30, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'north_1.7', label: 'Районы Крайнего Севера (РК 1,7)', shortLabel: 'КС РК 1,7', districtCoeff: 1.7, seniorityPercent: 40, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'north_1.8', label: 'Районы Крайнего Севера (РК 1,8)', shortLabel: 'КС РК 1,8', districtCoeff: 1.8, seniorityPercent: 50, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'north_2.0', label: 'Районы Крайнего Севера (РК 2,0)', shortLabel: 'КС РК 2,0', districtCoeff: 2.0, seniorityPercent: 50, highlandCoeff: 1, desertCoeff: 1 },
  { id: 'custom', label: 'Произвольные коэффициенты', shortLabel: 'Свои коэфф.', districtCoeff: 1, seniorityPercent: 0, highlandCoeff: 1, desertCoeff: 1 },
];

/** Эффективный суммарный коэффициент к окладу (п. 89, ст. 2 ч. 24 306-ФЗ) */
export function effectiveRegionalCoeff(zone: RegionalZone, custom?: Partial<RegionalZone>): number {
  const districtCoeff = custom?.districtCoeff ?? zone.districtCoeff;
  const highlandCoeff = custom?.highlandCoeff ?? zone.highlandCoeff;
  const desertCoeff = custom?.desertCoeff ?? zone.desertCoeff;
  return districtCoeff * highlandCoeff * desertCoeff;
}
