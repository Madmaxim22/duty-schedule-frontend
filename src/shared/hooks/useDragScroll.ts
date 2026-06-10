import { type Ref, useCallback, useEffect, useRef } from 'react';

const DRAG_THRESHOLD_PX = 5;

type DragState = {
  pointerId: number;
  startX: number;
  scrollLeft: number;
  dragging: boolean;
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  ref.current = value;
}

export function useDragScroll<T extends HTMLElement>(externalRef?: Ref<T | null>) {
  const innerRef = useRef<T | null>(null);
  const stateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  const setRef = useCallback(
    (node: T | null) => {
      innerRef.current = node;
      assignRef(externalRef, node);
    },
    [externalRef],
  );

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;

      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('[draggable="true"]')) return;

      stateRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        scrollLeft: el.scrollLeft,
        dragging: false,
      };
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const state = stateRef.current;
      if (!state || state.pointerId !== e.pointerId) return;

      const dx = e.clientX - state.startX;
      if (!state.dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
        state.dragging = true;
        el.classList.add('is-drag-scrolling');
      }

      e.preventDefault();
      el.scrollLeft = state.scrollLeft - dx;
    };

    const endPointer = (e: PointerEvent) => {
      const state = stateRef.current;
      if (!state || state.pointerId !== e.pointerId) return;

      if (state.dragging) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }

      stateRef.current = null;
      el.classList.remove('is-drag-scrolling');
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };

    const onClickCapture = (e: MouseEvent) => {
      if (!suppressClickRef.current) return;
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', endPointer);
    el.addEventListener('pointercancel', endPointer);
    el.addEventListener('click', onClickCapture, true);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', endPointer);
      el.removeEventListener('pointercancel', endPointer);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  return setRef;
}
