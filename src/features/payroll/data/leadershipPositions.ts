/**
 * Руководящие должности — приложение № 9 к приказу Росгвардии №472 (п. 52 п. 15)
 */

export type LeadershipGroup = 'p1' | 'p2' | 'p3';

export interface LeadershipPosition {
  id: string;
  label: string;
  percent: number;
  group: LeadershipGroup;
  /** Для п. 2 — звания, под которые подходит строка (подсказка) */
  rankIds?: string[];
}

export const LEADERSHIP_GROUP_LABELS: Record<LeadershipGroup, string> = {
  p1: 'П. 1 — округ / объединённая группировка (30%)',
  p2: 'П. 2 — подразделение 10+ чел. (по званию руководителя)',
  p3: 'П. 3 — отдельные должности',
};

export const LEADERSHIP_POSITIONS: LeadershipPosition[] = [
  // П. 1 — все 30%
  { id: 'p1_commander', label: 'Командующий войсками (военным) округа', percent: 30, group: 'p1' },
  { id: 'p1_first_deputy', label: 'Первый заместитель командующего', percent: 30, group: 'p1' },
  { id: 'p1_deputy', label: 'Заместитель командующего', percent: 30, group: 'p1' },
  { id: 'p1_aide', label: 'Помощник командующего', percent: 30, group: 'p1' },
  { id: 'p1_district_chief', label: 'Начальник округа (территориального)', percent: 30, group: 'p1' },
  { id: 'p1_dept_head', label: 'Начальник отдела округа', percent: 30, group: 'p1' },
  { id: 'p1_mgmt_head', label: 'Начальник управления округа', percent: 30, group: 'p1' },
  { id: 'p1_joint_cmd', label: 'Командующий объединённой группировкой', percent: 30, group: 'p1' },
  { id: 'p1_joint_deputy', label: 'Заместитель командующего объединённой группировкой', percent: 30, group: 'p1' },

  // П. 2 — по званию руководителя подразделения 10+ чел.
  {
    id: 'p2_colonel_plus',
    label: 'Руководитель: генерал-лейтенант / генерал-майор / полковник',
    percent: 30,
    group: 'p2',
    rankIds: ['gen_lt', 'gen_major', 'colonel'],
  },
  {
    id: 'p2_lt_colonel',
    label: 'Руководитель: подполковник',
    percent: 25,
    group: 'p2',
    rankIds: ['lt_colonel'],
  },
  {
    id: 'p2_major',
    label: 'Руководитель: майор',
    percent: 20,
    group: 'p2',
    rankIds: ['major'],
  },
  {
    id: 'p2_captain',
    label: 'Руководитель: капитан',
    percent: 15,
    group: 'p2',
    rankIds: ['captain'],
  },
  {
    id: 'p2_lieutenant',
    label: 'Руководитель: ст. лейтенант / лейтенант',
    percent: 10,
    group: 'p2',
    rankIds: ['sr_lieutenant', 'lieutenant', 'jr_lieutenant'],
  },

  // П. 3 — отдельные должности
  { id: 'p3_platoon_officer', label: 'Командир взвода (офицерский)', percent: 15, group: 'p3' },
  { id: 'p3_deputy_regiment', label: 'Зам. командира полка / отряда', percent: 5, group: 'p3' },
  { id: 'p3_deputy_company', label: 'Зам. командира роты, ст. фельдшер и др.', percent: 12.5, group: 'p3' },
  {
    id: 'p3_deputy_p2_15',
    label: 'Зам. руководителя п. 2 (руководитель — ген-лейт./ген-май./полковник)',
    percent: 15,
    group: 'p3',
  },
  {
    id: 'p3_deputy_p2_12',
    label: 'Зам. руководителя п. 2 (руководитель — подполковник)',
    percent: 12.5,
    group: 'p3',
  },
  { id: 'p3_deputy_p2_10', label: 'Зам. руководителя п. 2 (руководитель — майор)', percent: 10, group: 'p3' },
  { id: 'p3_deputy_p2_7', label: 'Зам. руководителя п. 2 (руководитель — капитан)', percent: 7.5, group: 'p3' },
  { id: 'p3_deputy_p2_5', label: 'Зам. руководителя п. 2 (руководитель — лейтенант)', percent: 5, group: 'p3' },
  {
    id: 'p3_sergeant',
    label: 'Старшина, зам. ком. взвода, сержантские должности',
    percent: 10,
    group: 'p3',
  },
];

const byId = new Map(LEADERSHIP_POSITIONS.map((p) => [p.id, p]));

export function getLeadershipPosition(id: string | undefined): LeadershipPosition | undefined {
  if (!id) return undefined;
  return byId.get(id);
}

/** Рекомендация п. 2 по текущему званию, если должность не выбрана */
export function getLeadershipP2Hint(rankId: string): string | null {
  const match = LEADERSHIP_POSITIONS.find(
    (p) => p.group === 'p2' && p.rankIds?.includes(rankId),
  );
  if (!match) return null;
  return `По вашему званию подходит п. 2: ${match.label} — ${match.percent}%`;
}

export const LEADERSHIP_OUS_ID = 'ous_leadership';
