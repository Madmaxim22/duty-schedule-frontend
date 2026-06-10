import { LEADERSHIP_OUS_ID } from '../data/leadershipPositions';
import { getLeadershipPosition } from '../data/leadershipPositions';
import type { PayrollInput } from '../types/payroll';

/** Синхронизирует выбор должности из Прил. № 9 с ОУС «руководство» */
export function applyLeadershipPosition(
  input: PayrollInput,
  positionId: string,
): PayrollInput {
  const pos = positionId ? getLeadershipPosition(positionId) : undefined;
  const selectedOusIds = input.selectedOusIds.filter((id) => id !== LEADERSHIP_OUS_ID);
  const ousCustomPercents = { ...input.ousCustomPercents };
  delete ousCustomPercents[LEADERSHIP_OUS_ID];

  if (pos) {
    selectedOusIds.push(LEADERSHIP_OUS_ID);
    ousCustomPercents[LEADERSHIP_OUS_ID] = pos.percent;
  }

  return {
    ...input,
    leadershipPositionId: positionId || undefined,
    selectedOusIds,
    ousCustomPercents,
  };
}
