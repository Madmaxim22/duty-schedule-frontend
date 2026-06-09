import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiRequest } from '@/shared/api/client';
import type { DaySchedule, MonthSchedule } from '@/shared/api/types';
import { getAllSlots, slotsFromMonthDay, type SlotValue } from './buildDutyMatrix';
import { matrixCellKey } from './types/matrix';

type ConflictState = {
  date: string;
  currentRevision: number;
  pendingSlots: SlotValue[];
};

export function useDutyMatrixEditor() {
  const queryClient = useQueryClient();
  const revisionCache = useRef(new Map<string, number>());
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [savingDates, setSavingDates] = useState<Set<string>>(new Set());

  const getMonthData = useCallback(
    (date: string): MonthSchedule | undefined => {
      const [year, month] = date.split('-').map(Number);
      return queryClient.getQueryData<MonthSchedule>(['schedule', 'month', year, month]);
    },
    [queryClient],
  );

  const getSlotsForDate = useCallback(
    (date: string): SlotValue[] => {
      const monthData = getMonthData(date);
      const day = monthData?.days.find((d) => d.date === date);
      return slotsFromMonthDay(day);
    },
    [getMonthData],
  );

  const saveDayMutation = useMutation({
    mutationFn: async ({
      date,
      slots,
      expectedRevision,
    }: {
      date: string;
      slots: SlotValue[];
      expectedRevision: number;
    }) => {
      return apiRequest<DaySchedule>(`/schedule/day/${date}`, {
        method: 'PUT',
        body: JSON.stringify({ expectedRevision, assignments: slots }),
      });
    },
    onSuccess: (data, variables) => {
      revisionCache.current.set(variables.date, data.revision);
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });

  const persistDay = useCallback(
    async (date: string, slots: SlotValue[]) => {
      setSavingDates((prev) => new Set(prev).add(date));
      try {
        let revision = revisionCache.current.get(date);
        if (revision === undefined) {
          const dayData = await apiRequest<DaySchedule>(`/schedule/day/${date}`);
          revision = dayData.revision;
          revisionCache.current.set(date, revision);
        }

        const result = await saveDayMutation.mutateAsync({
          date,
          slots,
          expectedRevision: revision,
        });
        revisionCache.current.set(date, result.revision);
        setConflict(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          const currentRevision = err.body?.currentRevision;
          if (typeof currentRevision === 'number') {
            setConflict({ date, currentRevision, pendingSlots: slots });
          }
        }
        throw err;
      } finally {
        setSavingDates((prev) => {
          const next = new Set(prev);
          next.delete(date);
          return next;
        });
      }
    },
    [getSlotsForDate, saveDayMutation],
  );

  const assignUserToSlot = useCallback(
    async (date: string, userId: string, section: 'A' | 'B', office: string) => {
      const slots = getSlotsForDate(date);
      const key = `${section}-${office}`;
      const next = slots.map((s) => {
        if (`${s.section}-${s.office}` === key) {
          return { ...s, userId };
        }
        if (s.userId === userId) {
          return { ...s, userId: null };
        }
        return s;
      });
      await persistDay(date, next);
    },
    [getSlotsForDate, persistDay],
  );

  const clearUserOnDate = useCallback(
    async (date: string, userId: string) => {
      const slots = getSlotsForDate(date).map((s) =>
        s.userId === userId ? { ...s, userId: null } : s,
      );
      await persistDay(date, slots);
    },
    [getSlotsForDate, persistDay],
  );

  const swapAssignments = useCallback(
    async (
      date: string,
      sourceUserId: string,
      targetUserId: string,
      sourceSlot: { section: 'A' | 'B'; office: string },
      targetSlot: { section: 'A' | 'B'; office: string } | null,
    ) => {
      const slots = getSlotsForDate(date);
      const sourceKey = `${sourceSlot.section}-${sourceSlot.office}`;
      const targetKey = targetSlot ? `${targetSlot.section}-${targetSlot.office}` : null;

      const next = slots.map((s) => {
        const k = `${s.section}-${s.office}`;
        if (k === sourceKey) {
          return { ...s, userId: targetUserId };
        }
        if (targetKey && k === targetKey) {
          return { ...s, userId: sourceUserId };
        }
        if (!targetKey && s.userId === targetUserId) {
          return { ...s, userId: null };
        }
        return s;
      });

      await persistDay(date, next);
    },
    [getSlotsForDate, persistDay],
  );

  const moveAssignment = useCallback(
    async (
      sourceDate: string,
      targetDate: string,
      slot: { section: 'A' | 'B'; office: string },
      targetUserId: string,
    ) => {
      const slotKey = `${slot.section}-${slot.office}`;

      const sourceSlots = getSlotsForDate(sourceDate).map((s) =>
        `${s.section}-${s.office}` === slotKey ? { ...s, userId: null } : s,
      );

      const targetSlots = getSlotsForDate(targetDate).map((s) => {
        const k = `${s.section}-${s.office}`;
        if (k === slotKey) {
          return { ...s, userId: targetUserId };
        }
        if (s.userId === targetUserId) {
          return { ...s, userId: null };
        }
        return s;
      });

      await persistDay(sourceDate, sourceSlots);
      await persistDay(targetDate, targetSlots);
    },
    [getSlotsForDate, persistDay],
  );

  const resolveConflictReload = useCallback(async () => {
    if (!conflict) return;
    setConflict(null);
    revisionCache.current.delete(conflict.date);
    await queryClient.invalidateQueries({ queryKey: ['schedule'] });
  }, [conflict, queryClient]);

  const resolveConflictOverwrite = useCallback(async () => {
    if (!conflict) return;
    const { date, currentRevision, pendingSlots } = conflict;
    setSavingDates((prev) => new Set(prev).add(date));
    try {
      const result = await saveDayMutation.mutateAsync({
        date,
        slots: pendingSlots,
        expectedRevision: currentRevision,
      });
      revisionCache.current.set(date, result.revision);
      setConflict(null);
      await queryClient.invalidateQueries({ queryKey: ['schedule'] });
    } finally {
      setSavingDates((prev) => {
        const next = new Set(prev);
        next.delete(date);
        return next;
      });
    }
  }, [conflict, saveDayMutation, queryClient]);

  const getFreeSlots = useCallback(
    (date: string) => {
      const slots = getSlotsForDate(date);
      return getAllSlots().filter((template) => {
        const existing = slots.find(
          (s) => s.section === template.section && s.office === template.office,
        );
        return !existing?.userId;
      });
    },
    [getSlotsForDate],
  );

  const findSlotForUser = useCallback(
    (date: string, userId: string) => {
      const slots = getSlotsForDate(date);
      return slots.find((s) => s.userId === userId) ?? null;
    },
    [getSlotsForDate],
  );

  return {
    assignUserToSlot,
    clearUserOnDate,
    swapAssignments,
    moveAssignment,
    getFreeSlots,
    findSlotForUser,
    getSlotsForDate,
    savingDates,
    conflict,
    resolveConflictReload,
    resolveConflictOverwrite,
    isSaving: saveDayMutation.isPending,
    matrixCellKey,
  };
}
