import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { matrixCellKey } from './types/matrix';

const LONG_PRESS_MS = 400;
const DRAG_THRESHOLD_PX = 6;

export type MatrixDragPayload = {
  date: string;
  userId: string;
  section: 'A' | 'B';
  office: string;
};

type DragState = {
  pointerId: number;
  payload: MatrixDragPayload;
  sourceKey: string;
  longPressTimer?: ReturnType<typeof setTimeout>;
  started: boolean;
  startX: number;
  startY: number;
};

function findDutyCellButton(el: Element | null): HTMLButtonElement | null {
  const btn = el?.closest('.duty-matrix__cell-btn, .duty-matrix__absence');
  return btn instanceof HTMLButtonElement ? btn : null;
}

function readPayload(btn: HTMLButtonElement): MatrixDragPayload | null {
  const raw = btn.dataset.dragPayload;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MatrixDragPayload;
  } catch {
    return null;
  }
}

function readCellTarget(btn: HTMLButtonElement): { userId: string; date: string } | null {
  const userId = btn.dataset.userId;
  const date = btn.dataset.date;
  if (!userId || !date) return null;
  return { userId, date };
}

type Options = {
  enabled: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onDrop: (payload: MatrixDragPayload, targetUserId: string, targetDate: string) => void;
  onDropOnAbsence?: (absenceType: string) => void;
};

export function useMatrixCellDrag({
  enabled,
  containerRef,
  onDrop,
  onDropOnAbsence,
}: Options) {
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const stateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const onDropRef = useRef(onDrop);
  const onDropOnAbsenceRef = useRef(onDropOnAbsence);

  onDropRef.current = onDrop;
  onDropOnAbsenceRef.current = onDropOnAbsence;

  const clearState = useCallback(() => {
    const state = stateRef.current;
    if (state?.longPressTimer) clearTimeout(state.longPressTimer);
    stateRef.current = null;
    setDraggingKey(null);
    setDragOverKey(null);
  }, []);

  const resolveHover = useCallback((clientX: number, clientY: number) => {
    const btn = findDutyCellButton(document.elementFromPoint(clientX, clientY));
    if (!btn) {
      setDragOverKey(null);
      return null;
    }

    if (btn.classList.contains('duty-matrix__absence')) {
      setDragOverKey(null);
      return { absenceType: btn.title || 'отсутствие' };
    }

    const target = readCellTarget(btn);
    if (!target) {
      setDragOverKey(null);
      return null;
    }

    setDragOverKey(matrixCellKey(target.userId, target.date));
    return target;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const beginDrag = (state: DragState) => {
      state.started = true;
      setDraggingKey(state.sourceKey);
      el.classList.add('duty-matrix__scroll--cell-dragging');
      try {
        el.setPointerCapture(state.pointerId);
      } catch {
        /* already captured */
      }
      navigator.vibrate?.(12);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;

      const btn = findDutyCellButton(e.target as Element);
      if (!btn || btn.disabled || !btn.classList.contains('duty-matrix__cell-btn')) return;

      const payload = readPayload(btn);
      if (!payload) return;

      const sourceKey = matrixCellKey(payload.userId, payload.date);
      const isTouch = e.pointerType === 'touch';

      const state: DragState = {
        pointerId: e.pointerId,
        payload,
        sourceKey,
        started: false,
        startX: e.clientX,
        startY: e.clientY,
      };

      if (isTouch) {
        state.longPressTimer = setTimeout(() => beginDrag(state), LONG_PRESS_MS);
      }

      stateRef.current = state;
    };

    const onPointerMove = (e: PointerEvent) => {
      const state = stateRef.current;
      if (!state || state.pointerId !== e.pointerId) return;

      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;

      if (!state.started) {
        const moved = Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX;
        if (!moved) return;

        if (state.longPressTimer) {
          clearTimeout(state.longPressTimer);
          state.longPressTimer = undefined;
          clearState();
          return;
        }

        beginDrag(state);
      }

      e.preventDefault();
      resolveHover(e.clientX, e.clientY);
    };

    const finishDrag = (e: PointerEvent) => {
      const state = stateRef.current;
      if (!state || state.pointerId !== e.pointerId) return;

      if (state.longPressTimer) {
        clearTimeout(state.longPressTimer);
        stateRef.current = null;
        return;
      }

      if (state.started) {
        e.preventDefault();
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);

        const hover = resolveHover(e.clientX, e.clientY);
        if (hover && 'absenceType' in hover && hover.absenceType) {
          onDropOnAbsenceRef.current?.(hover.absenceType);
        } else if (hover && 'userId' in hover && hover.userId && hover.date) {
          onDropRef.current(state.payload, hover.userId, hover.date);
        }

        el.classList.remove('duty-matrix__scroll--cell-dragging');
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }
      }

      clearState();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove, { passive: false });
    el.addEventListener('pointerup', finishDrag);
    el.addEventListener('pointercancel', finishDrag);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', finishDrag);
      el.removeEventListener('pointercancel', finishDrag);
      const active = stateRef.current;
      if (active?.longPressTimer) clearTimeout(active.longPressTimer);
      stateRef.current = null;
      el.classList.remove('duty-matrix__scroll--cell-dragging');
    };
  }, [enabled, containerRef, clearState, resolveHover]);

  const shouldSuppressClick = useCallback(() => suppressClickRef.current, []);

  return { draggingKey, dragOverKey, shouldSuppressClick };
}
