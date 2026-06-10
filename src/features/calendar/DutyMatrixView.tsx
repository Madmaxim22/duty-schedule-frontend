import { useCallback, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import { createPortal } from 'react-dom';
import { apiRequest } from '@/shared/api/client';
import type { ApprovedUserForAssign, MonthSchedule } from '@/shared/api/types';
import { parseDateKey, toDateKey } from '@/shared/lib/dateKey';
import { formatSurnameWithInitials } from '@/shared/lib/formatName';
import { Button } from '@/shared/ui/Button';
import { useDragScroll } from '@/shared/hooks/useDragScroll';
import { Modal } from '@/shared/ui/Modal';
import {
  buildColumnsForRange,
  buildDutyMatrix,
  buildMatrixRowSegments,
  computeIncompleteDates,
} from './buildDutyMatrix';
import { DutyMatrixAssignPopover } from './DutyMatrixAssignPopover';
import {
  useDeleteAbsencesMutation,
  useUpsertAbsencesMutation,
} from '@/features/absences/useAbsences';
import { useDutyMatrixEditor } from './useDutyMatrixEditor';
import { matrixCellKey, type MatrixAssignment, type MatrixColumn } from './types/matrix';
import { useMatrixCellDrag } from './useMatrixCellDrag';
import { useMatrixDayWindow } from './useMatrixDayWindow';
import { useMatrixMonthScroll } from './useMatrixMonthScroll';
import './duty-matrix.css';

function getMonthKeysInRange(windowStart: string, visibleDays: number) {
  const keys = new Map<string, { year: number; month: number }>();
  const start = parseDateKey(windowStart);

  for (let i = 0; i < visibleDays; i++) {
    const d = addDays(start, i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    keys.set(`${y}-${m}`, { year: y, month: m });
  }

  return [...keys.values()];
}

function mergeSchedules(schedules: MonthSchedule[], isAdmin: boolean): MonthSchedule {
  const days = schedules.flatMap((s) => s.days);
  const absences = schedules.flatMap((s) => s.absences ?? []);
  const incompleteDates = isAdmin
    ? schedules.flatMap((s) => s.monthCoverage?.incompleteDates ?? [])
    : [];
  const first = schedules[0];

  return {
    year: first?.year ?? 0,
    month: first?.month ?? 0,
    days,
    absences,
    monthCoverage: isAdmin
      ? { allComplete: incompleteDates.length === 0, incompleteDates }
      : undefined,
  };
}

function getDateHeadClass(col: MatrixColumn): string {
  const classes = ['duty-matrix__date-head'];
  if (col.isHoliday) classes.push('duty-matrix__date-head--holiday');
  else if (col.isWeekend) classes.push('duty-matrix__date-head--weekend');
  if (col.isIncomplete) classes.push('duty-matrix__date-head--incomplete');
  return classes.join(' ');
}

function getDateCellClass(col: MatrixColumn): string {
  if (col.isHoliday) return 'duty-matrix__cell--holiday';
  if (col.isWeekend) return 'duty-matrix__cell--weekend';
  return '';
}

type DragPayload = {
  date: string;
  userId: string;
  section: 'A' | 'B';
  office: string;
};

type AssignTarget = {
  date: string;
  userId: string;
  userName: string;
  hasAssignment: boolean;
  absenceType?: string;
};

type Props = {
  month: Date;
  onMonthChange: (month: Date) => void;
  schedule: MonthSchedule;
  isAdmin: boolean;
  currentUserId?: string;
  onSelectDate: (date: string) => void;
  isRefreshing?: boolean;
};

export function DutyMatrixView({
  month,
  onMonthChange,
  schedule,
  isAdmin,
  currentUserId,
  onSelectDate,
  isRefreshing,
}: Props) {
  const year = month.getFullYear();
  const monthNum = month.getMonth() + 1;

  const usersQuery = useQuery({
    queryKey: ['users', 'approved'],
    queryFn: () => apiRequest<{ users: ApprovedUserForAssign[] }>('/users'),
    enabled: isAdmin,
  });

  const editor = useDutyMatrixEditor();
  const upsertAbsenceMutation = useUpsertAbsencesMutation();
  const deleteAbsenceMutation = useDeleteAbsencesMutation();
  const { windowStart, visibleDays, currentMonthStartIndex, currentMonthDayCount } =
    useMatrixDayWindow({ month });
  const monthScrollRef = useMatrixMonthScroll({
    month,
    onMonthChange,
    currentMonthStartIndex,
    currentMonthDayCount,
  });
  const dragScrollRef = useDragScroll<HTMLDivElement>(monthScrollRef);
  const matrixScrollElRef = useRef<HTMLDivElement | null>(null);
  const setMatrixScrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      matrixScrollElRef.current = node;
      dragScrollRef(node);
    },
    [dragScrollRef],
  );

  const monthKeys = useMemo(
    () => getMonthKeysInRange(windowStart, visibleDays),
    [windowStart, visibleDays],
  );

  const scheduleQueries = useQueries({
    queries: monthKeys.map(({ year: y, month: m }) => ({
      queryKey: ['schedule', 'month', y, m],
      queryFn: () => apiRequest<MonthSchedule>(`/schedule/month?year=${y}&month=${m}`),
      placeholderData: keepPreviousData,
      initialData: y === year && m === monthNum ? schedule : undefined,
    })),
  });

  const mergedSchedule = useMemo(() => {
    const loaded = scheduleQueries
      .map((q) => q.data)
      .filter((data): data is MonthSchedule => Boolean(data));
    if (loaded.length === 0) return schedule;
    return mergeSchedules(loaded, isAdmin);
  }, [scheduleQueries, schedule, isAdmin]);

  const incompleteDates = useMemo(() => {
    if (!isAdmin) return undefined;

    const start = parseDateKey(windowStart);
    const windowDates = new Set(
      Array.from({ length: visibleDays }, (_, i) =>
        toDateKey(addDays(start, i)),
      ),
    );

    return computeIncompleteDates(mergedSchedule.days).filter((date) =>
      windowDates.has(date),
    );
  }, [windowStart, visibleDays, mergedSchedule.days, isAdmin]);

  const columns = useMemo(
    () => buildColumnsForRange(windowStart, visibleDays, incompleteDates),
    [windowStart, visibleDays, incompleteDates],
  );

  const model = useMemo(
    () =>
      buildDutyMatrix({
        columns,
        schedule: mergedSchedule,
        approvedUsers: usersQuery.data?.users,
        currentUserId,
        isAdmin,
      }),
    [columns, mergedSchedule, usersQuery.data?.users, currentUserId, isAdmin],
  );

  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);
  const [keyboardPick, setKeyboardPick] = useState<DragPayload | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const freeSlots = assignTarget ? editor.getFreeSlots(assignTarget.date) : [];

  const handleAssign = useCallback(
    async (section: 'A' | 'B', office: string) => {
      if (!assignTarget) return;
      setActionError(null);
      try {
        await editor.assignUserToSlot(assignTarget.date, assignTarget.userId, section, office);
        setAssignTarget(null);
      } catch (err) {
        setActionError((err as Error).message);
      }
    },
    [assignTarget, editor],
  );

  const handleClear = useCallback(async () => {
    if (!assignTarget) return;
    setActionError(null);
    try {
      await editor.clearUserOnDate(assignTarget.date, assignTarget.userId);
      setAssignTarget(null);
    } catch (err) {
      setActionError((err as Error).message);
    }
  }, [assignTarget, editor]);

  const handleMarkAbsent = useCallback(
    async (absenceType: string) => {
      if (!assignTarget) return;
      setActionError(null);
      try {
        await upsertAbsenceMutation.mutateAsync({
          userId: assignTarget.userId,
          dateFrom: assignTarget.date,
          dateTo: assignTarget.date,
          absenceType,
        });
        setAssignTarget(null);
      } catch (err) {
        setActionError((err as Error).message);
      }
    },
    [assignTarget, upsertAbsenceMutation],
  );

  const handleRemoveAbsent = useCallback(async () => {
    if (!assignTarget) return;
    setActionError(null);
    try {
      await deleteAbsenceMutation.mutateAsync({
        userId: assignTarget.userId,
        dateFrom: assignTarget.date,
        dateTo: assignTarget.date,
      });
      setAssignTarget(null);
    } catch (err) {
      setActionError((err as Error).message);
    }
  }, [assignTarget, deleteAbsenceMutation]);

  const isUserAbsentOnDate = useCallback(
    (userId: string, date: string) =>
      Boolean(model.cells.get(matrixCellKey(userId, date))?.absenceType),
    [model.cells],
  );

  const handleDrop = useCallback(
    async (payload: DragPayload, targetUserId: string, targetDate: string) => {
      setActionError(null);

      if (!isAdmin) return;
      if (payload.userId === targetUserId && payload.date === targetDate) return;

      if (isUserAbsentOnDate(targetUserId, targetDate)) {
        const absenceType = model.cells.get(matrixCellKey(targetUserId, targetDate))?.absenceType;
        setActionError(
          absenceType
            ? `Сотрудник отсутствует (${absenceType})`
            : 'Сотрудник отсутствует в этот день',
        );
        return;
      }

      try {
        const targetSlot = editor.findSlotForUser(targetDate, targetUserId);

        if (payload.date === targetDate) {
          await editor.swapAssignments(
            targetDate,
            payload.userId,
            targetUserId,
            { section: payload.section, office: payload.office },
            targetSlot
              ? { section: targetSlot.section, office: targetSlot.office }
              : null,
          );
        } else {
          await editor.moveAssignment(
            payload.date,
            targetDate,
            { section: payload.section, office: payload.office },
            targetUserId,
          );
        }
      } catch (err) {
        setActionError((err as Error).message);
      }
    },
    [editor, isAdmin, isUserAbsentOnDate, model.cells],
  );

  const { draggingKey, dragOverKey, shouldSuppressClick } = useMatrixCellDrag({
    enabled: isAdmin,
    containerRef: matrixScrollElRef,
    onDrop: (payload, targetUserId, targetDate) => {
      void handleDrop(payload, targetUserId, targetDate);
    },
    onDropOnAbsence: (absenceType) => {
      setActionError(`Сотрудник отсутствует (${absenceType})`);
    },
  });

  const onCellClick = (
    date: string,
    userId: string,
    userName: string,
    assignment: MatrixAssignment | null,
    extraOffices?: string[],
    absenceType?: string,
  ) => {
    if (shouldSuppressClick()) return;

    if (isAdmin) {
      setAssignTarget({
        date,
        userId,
        userName,
        hasAssignment: Boolean(assignment || extraOffices?.length),
        absenceType,
      });
      return;
    }
    onSelectDate(date);
  };

  const conflictModal = editor.conflict ? (
    <Modal
      open
      title="График изменён"
      onClose={() => {
        if (!editor.isSaving) void editor.resolveConflictReload();
      }}
      footer={
        <div className="modal__footer-actions">
          <Button
            variant="secondary"
            disabled={editor.isSaving}
            onClick={() => void editor.resolveConflictReload()}
          >
            Загрузить актуальную версию
          </Button>
          <Button
            variant="danger"
            disabled={editor.isSaving}
            onClick={() => void editor.resolveConflictOverwrite()}
          >
            {editor.isSaving ? 'Сохранение…' : 'Сохранить мои изменения'}
          </Button>
        </div>
      }
    >
      <p>
        Другой администратор уже изменил график на эту дату. Загрузите актуальную версию или
        сохраните свои изменения.
      </p>
    </Modal>
  ) : null;

  return (
    <section
      className={`duty-matrix${isRefreshing ? ' duty-matrix--loading' : ''}`}
      aria-busy={isRefreshing || editor.isSaving || undefined}
    >
      {actionError ? (
        <p className="form-message form-message--error">{actionError}</p>
      ) : null}

      <div className="duty-matrix__frame">
        <div ref={setMatrixScrollRef} className="duty-matrix__scroll">
          <table className="duty-matrix__table">
          <thead>
            <tr>
              <th className="duty-matrix__corner" scope="col">
                Сотрудник
              </th>
              {model.columns.map((col) => (
                <th key={col.date} scope="col" className={getDateHeadClass(col)}>
                  <span className="duty-matrix__date-num">{col.dayNum}</span>
                  <span className="duty-matrix__date-month">{col.monthLabel}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row) => {
              const segments = buildMatrixRowSegments(row.userId, model.columns, model.cells);

              return (
                <tr key={row.userId}>
                  <th className="duty-matrix__user" scope="row" title={row.fullName}>
                    {formatSurnameWithInitials(row.fullName)}
                  </th>
                  {segments.map((segment) => {
                    if (segment.type === 'absence') {
                      const firstCol = segment.columns[0];
                      const lastCol = segment.columns[segment.columns.length - 1];
                      const rangeLabel =
                        segment.columns.length === 1
                          ? `${firstCol.dayNum}`
                          : `${firstCol.dayNum}–${lastCol.dayNum}`;

                      return (
                        <td
                          key={`${row.userId}-${firstCol.date}-absence`}
                          colSpan={segment.columns.length}
                          className="duty-matrix__cell--absent"
                        >
                          <button
                            type="button"
                            className={`duty-matrix__absence${isAdmin ? ' duty-matrix__absence--clickable' : ''}`}
                            data-user-id={row.userId}
                            data-date={firstCol.date}
                            title={segment.absenceType}
                            aria-label={`${row.fullName}, ${rangeLabel}: ${segment.absenceType}`}
                            disabled={!isAdmin}
                            onClick={() =>
                              onCellClick(
                                firstCol.date,
                                row.userId,
                                row.fullName,
                                null,
                                undefined,
                                segment.absenceType,
                              )
                            }
                          >
                            <span className="duty-matrix__absence-label">
                              {segment.absenceType}
                            </span>
                          </button>
                        </td>
                      );
                    }

                    const { column: col, cell } = segment;
                    const assignment = cell.assignment ?? null;
                    const cellKey = matrixCellKey(row.userId, col.date);
                    const isMy = row.userId === currentUserId && Boolean(assignment);
                    const isSaving = editor.savingDates.has(col.date);
                    const label = assignment?.officeLabel ?? '';
                    const extra = cell.extraOffices;

                    const btnClass = [
                      'duty-matrix__cell-btn',
                      assignment ? 'duty-matrix__cell-btn--filled' : '',
                      isMy ? 'duty-matrix__cell-btn--my' : '',
                      isAdmin ? 'duty-matrix__cell-btn--clickable' : '',
                      dragOverKey === cellKey ? 'duty-matrix__cell-btn--drag-over' : '',
                      draggingKey === cellKey ? 'duty-matrix__cell-btn--dragging' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');

                    const payload: DragPayload | null = assignment
                      ? {
                          date: col.date,
                          userId: row.userId,
                          section: assignment.section,
                          office: assignment.office,
                        }
                      : null;

                    return (
                      <td key={col.date} className={getDateCellClass(col)}>
                        <button
                          type="button"
                          className={btnClass}
                          disabled={isSaving}
                          data-matrix-draggable={payload ? 'true' : undefined}
                          data-user-id={row.userId}
                          data-date={col.date}
                          data-drag-payload={payload ? JSON.stringify(payload) : undefined}
                          title={extra?.length ? `Также: ${extra.join(', ')}` : undefined}
                          onClick={() =>
                            onCellClick(
                              col.date,
                              row.userId,
                              row.fullName,
                              assignment,
                              extra,
                              cell.absenceType,
                            )
                          }
                          onKeyDown={(e) => {
                            if (!isAdmin || !payload) return;
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (keyboardPick) {
                                void handleDrop(keyboardPick, row.userId, col.date);
                                setKeyboardPick(null);
                              } else {
                                setKeyboardPick(payload);
                              }
                            }
                            if (e.key === 'Escape') setKeyboardPick(null);
                          }}
                          aria-label={
                            assignment
                              ? `${row.fullName}, ${col.dayNum}: кабинет ${label}`
                              : `${row.fullName}, ${col.dayNum}: нет дежурства`
                          }
                        >
                          {label || '—'}
                          {extra?.length ? (
                            <span className="duty-matrix__extra">+{extra.join('+')}</span>
                          ) : null}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>

      {assignTarget
        ? createPortal(
            <>
              <button
                type="button"
                className="duty-matrix-popover-backdrop"
                aria-label="Закрыть"
                onClick={() => setAssignTarget(null)}
              />
              <DutyMatrixAssignPopover
                date={assignTarget.date}
                userId={assignTarget.userId}
                userName={assignTarget.userName}
                freeSlots={freeSlots}
                hasAssignment={assignTarget.hasAssignment}
                absenceType={assignTarget.absenceType}
                isSaving={
                  upsertAbsenceMutation.isPending || deleteAbsenceMutation.isPending
                }
                onAssign={(section, office) => void handleAssign(section, office)}
                onClear={() => void handleClear()}
                onMarkAbsent={(type) => void handleMarkAbsent(type)}
                onRemoveAbsent={() => void handleRemoveAbsent()}
                onClose={() => setAssignTarget(null)}
              />
            </>,
            document.body,
          )
        : null}

      {conflictModal}
    </section>
  );
}
