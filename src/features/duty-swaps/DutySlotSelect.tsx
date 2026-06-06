import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { formatDutySwapSlot } from '@/shared/lib/formatDutySwap';
import { slotKey } from '@/features/duty-swaps/collectMyUpcomingDutySlots';
import type { SwapSlotPick } from '@/features/duty-swaps/SwapRequestModal';

type Props = {
  id: string;
  slots: SwapSlotPick[];
  value: SwapSlotPick | null;
  onChange: (slot: SwapSlotPick | null) => void;
  placeholder?: string;
};

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DutySlotSelect({
  id,
  slots,
  value,
  onChange,
  placeholder = 'Выберите дежурство',
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    setOpen(false);
  }, [slots]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (wrapRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  const selectedKey = value ? slotKey(value) : '';
  const showPlaceholder = slots.length > 1 && !value;

  return (
    <div
      ref={wrapRef}
      className={`duty-swap-modal__select-wrap${open ? ' duty-swap-modal__select-wrap--open' : ''}`}
    >
      <button
        type="button"
        id={id}
        className="duty-swap-modal__select duty-swap-modal__select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span
          className={`duty-swap-modal__select-value${
            showPlaceholder ? ' duty-swap-modal__select-value--placeholder' : ''
          }`}
        >
          {value ? formatDutySwapSlot(value) : placeholder}
        </span>
        <ChevronDownIcon className="duty-swap-modal__select-chevron" />
      </button>

      <ul
        id={listId}
        className="duty-swap-modal__select-list"
        role="listbox"
        aria-labelledby={id}
        aria-hidden={!open}
      >
        {slots.map((slot, index) => {
          const key = slotKey(slot);
          const selected = key === selectedKey;

          return (
            <li key={key} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={open ? 0 : -1}
                className={`duty-swap-modal__select-option${
                  selected ? ' duty-swap-modal__select-option--selected' : ''
                }`}
                style={{ '--option-index': index } as CSSProperties}
                onClick={() => {
                  onChange(slot);
                  setOpen(false);
                }}
              >
                {formatDutySwapSlot(slot)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
