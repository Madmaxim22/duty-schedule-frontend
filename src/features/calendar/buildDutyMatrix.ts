import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { addDays } from 'date-fns';
import type { ApprovedUserForAssign, MonthDay, MonthSchedule } from '@/shared/api/types';
import { DUTY_SECTIONS } from '@/shared/constants/offices';
import { parseDateKey, toDateKey } from '@/shared/lib/dateKey';
import { isPublicHoliday, isWeekend } from '@/shared/lib/nonWorkingDay';
import {
  matrixCellKey,
  type DutyMatrixModel,
  type MatrixAssignment,
  type MatrixCellData,
  type MatrixColumn,
  type MatrixRow,
  type MatrixRowSegment,
} from './types/matrix';

export type SlotValue = {
  section: 'A' | 'B';
  office: string;
  userId: string | null;
};

export function getAllSlots(): SlotValue[] {
  const slots: SlotValue[] = [];
  for (const section of DUTY_SECTIONS) {
    for (const office of section.offices) {
      slots.push({ section: section.id, office: office.code, userId: null });
    }
  }
  return slots;
}

export function slotsFromMonthDay(day: MonthDay | undefined): SlotValue[] {
  const slots = getAllSlots();
  if (!day) return slots;
  const byKey = new Map(
    day.duties.map((d) => [`${d.section}-${d.office}`, d.userId] as const),
  );
  return slots.map((s) => ({
    ...s,
    userId: byKey.get(`${s.section}-${s.office}`) ?? null,
  }));
}

export function computeIncompleteDates(days: MonthDay[]): string[] {
  const incomplete: string[] = [];

  for (const day of days) {
    const assigned = new Set(day.duties.map((d) => `${d.section}-${d.office}`));
    let complete = true;

    for (const section of DUTY_SECTIONS) {
      for (const office of section.offices) {
        if (office.mandatory && !assigned.has(`${section.id}-${office.code}`)) {
          complete = false;
          break;
        }
      }
      if (!complete) break;
    }

    if (!complete) incomplete.push(day.date);
  }

  return incomplete;
}

export function buildMatrixColumn(
  date: string,
  incompleteSet?: Set<string>,
): MatrixColumn {
  const d = parseDateKey(date);
  return {
    date,
    dayNum: d.getDate(),
    monthLabel: format(d, 'LLL', { locale: ru }).replace('.', ''),
    isIncomplete: incompleteSet?.has(date),
    isWeekend: isWeekend(date),
    isHoliday: isPublicHoliday(date),
  };
}

export function buildColumnsForRange(
  startDate: string,
  count: number,
  incompleteDates?: string[],
): MatrixColumn[] {
  const incompleteSet = incompleteDates ? new Set(incompleteDates) : undefined;
  const start = parseDateKey(startDate);

  return Array.from({ length: count }, (_, i) =>
    buildMatrixColumn(toDateKey(addDays(start, i)), incompleteSet),
  );
}

function buildRows(
  schedule: MonthSchedule,
  approvedUsers: ApprovedUserForAssign[] | undefined,
  currentUserId: string | undefined,
): MatrixRow[] {
  if (approvedUsers?.length) {
    return [...approvedUsers]
      .filter((u) => u.role !== 'admin')
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'))
      .map((u) => ({ userId: u.id, fullName: u.fullName }));
  }

  const byId = new Map<string, string>();
  for (const day of schedule.days) {
    for (const duty of day.duties) {
      byId.set(duty.userId, duty.fullName);
    }
  }
  if (currentUserId && !byId.has(currentUserId)) {
    byId.set(currentUserId, '');
  }
  return [...byId.entries()]
    .sort((a, b) => (a[1] || a[0]).localeCompare(b[1] || b[0], 'ru'))
    .map(([userId, fullName]) => ({ userId, fullName: fullName || '—' }));
}

function pickPrimaryAssignment(
  duties: MonthDay['duties'],
  userId: string,
): { primary: MatrixAssignment | null; extra: string[] } {
  const mine = duties
    .filter((d) => d.userId === userId)
    .sort((a, b) => a.section.localeCompare(b.section) || a.office.localeCompare(b.office));

  if (mine.length === 0) {
    return { primary: null, extra: [] };
  }

  const first = mine[0];
  const primary: MatrixAssignment = {
    section: first.section,
    office: first.office,
    officeLabel: first.office,
  };
  const extra = mine.slice(1).map((d) => d.office);
  return { primary, extra };
}

function buildAbsenceMap(schedule: MonthSchedule): Map<string, string> {
  const map = new Map<string, string>();
  for (const absence of schedule.absences ?? []) {
    map.set(matrixCellKey(absence.userId, absence.date), absence.absenceType);
  }
  return map;
}

export function buildDutyMatrix(input: {
  columns: MatrixColumn[];
  schedule: MonthSchedule;
  approvedUsers?: ApprovedUserForAssign[];
  currentUserId?: string;
  isAdmin?: boolean;
}): DutyMatrixModel {
  const { columns, schedule, approvedUsers, currentUserId, isAdmin } = input;
  const daysByDate = new Map(schedule.days.map((d) => [d.date, d]));
  const absenceMap = buildAbsenceMap(schedule);
  const rows = buildRows(schedule, isAdmin ? approvedUsers : undefined, currentUserId);

  const cells = new Map<string, MatrixCellData>();
  for (const row of rows) {
    for (const col of columns) {
      const day = daysByDate.get(col.date);
      const { primary, extra } = pickPrimaryAssignment(day?.duties ?? [], row.userId);
      const absenceType = absenceMap.get(matrixCellKey(row.userId, col.date));
      cells.set(matrixCellKey(row.userId, col.date), {
        date: col.date,
        userId: row.userId,
        assignment: absenceType ? null : primary,
        extraOffices: absenceType ? undefined : extra.length > 0 ? extra : undefined,
        absenceType,
      });
    }
  }

  return { rows, columns, cells };
}

export function buildMatrixRowSegments(
  userId: string,
  columns: MatrixColumn[],
  cells: Map<string, MatrixCellData>,
): MatrixRowSegment[] {
  const segments: MatrixRowSegment[] = [];
  let index = 0;

  while (index < columns.length) {
    const column = columns[index];
    const cell = cells.get(matrixCellKey(userId, column.date));
    const absenceType = cell?.absenceType;

    if (absenceType) {
      const run: MatrixColumn[] = [column];
      let next = index + 1;

      while (next < columns.length) {
        const nextColumn = columns[next];
        const nextCell = cells.get(matrixCellKey(userId, nextColumn.date));
        if (nextCell?.absenceType === absenceType) {
          run.push(nextColumn);
          next += 1;
        } else {
          break;
        }
      }

      segments.push({ type: 'absence', columns: run, absenceType });
      index = next;
      continue;
    }

    segments.push({
      type: 'duty',
      column,
      cell: cell ?? {
        date: column.date,
        userId,
        assignment: null,
      },
    });
    index += 1;
  }

  return segments;
}
