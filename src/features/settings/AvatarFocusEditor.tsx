import { useCallback, useRef, useState } from 'react';
import { avatarImageStyle, clampAvatarFocus } from '@/shared/lib/avatarFocus';

type Props = {
  src: string;
  focusX: number;
  focusY: number;
  onChange: (focusX: number, focusY: number) => void;
  disabled?: boolean;
  label?: string;
};

function focusFromPointer(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): { focusX: number; focusY: number } {
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  return {
    focusX: clampAvatarFocus(x),
    focusY: clampAvatarFocus(y),
  };
}

export function AvatarFocusEditor({
  src,
  focusX,
  focusY,
  onChange,
  disabled = false,
  label = 'Перетащите, чтобы выбрать область для круглого аватара',
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const applyPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      const next = focusFromPointer(clientX, clientY, rect);
      onChange(next.focusX, next.focusY);
    },
    [onChange],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    draggingRef.current = true;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    applyPointer(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || disabled) return;
    applyPointer(e.clientX, e.clientY);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="avatar-focus-editor">
      <p className="avatar-focus-editor__hint">{label}</p>
      <div
        ref={frameRef}
        className={`avatar-focus-editor__frame${dragging ? ' avatar-focus-editor__frame--dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="application"
        aria-label={label}
      >
        <img
          src={src}
          alt=""
          className="avatar-focus-editor__image"
          style={avatarImageStyle(focusX, focusY)}
          draggable={false}
        />
        <div className="avatar-focus-editor__mask" aria-hidden />
        <span
          className="avatar-focus-editor__reticle"
          style={{ left: `${focusX}%`, top: `${focusY}%` }}
          aria-hidden
        />
      </div>
      <div className="avatar-focus-editor__preview-row" aria-hidden>
        <span className="avatar-focus-editor__preview avatar avatar--sm avatar--image">
          <img src={src} alt="" style={avatarImageStyle(focusX, focusY)} />
        </span>
        <span className="avatar-focus-editor__preview avatar avatar--md avatar--image">
          <img src={src} alt="" style={avatarImageStyle(focusX, focusY)} />
        </span>
      </div>
    </div>
  );
}
