import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import type { ApprovedUserForAssign } from '@/shared/api/types';
import { DUTY_SECTIONS } from '@/shared/constants/offices';
import type { SlotValue } from './buildDutyMatrix';

type Props = {
  date: string;
  userId: string;
  userName: string;
  freeSlots: SlotValue[];
  onAssign: (section: 'A' | 'B', office: string) => void;
  onClear: () => void;
  onClose: () => void;
  hasAssignment: boolean;
};

export function DutyMatrixAssignPopover({
  date,
  userId,
  userName,
  freeSlots,
  onAssign,
  onClear,
  onClose,
  hasAssignment,
}: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['users', 'approved', date],
    queryFn: () =>
      apiRequest<{ users: ApprovedUserForAssign[] }>(`/users?date=${date}`),
  });

  const targetUser = data?.users.find((u) => u.id === userId);
  const isAbsent = targetUser?.isAbsent ?? false;
  const freeSlotKeys = new Set(
    freeSlots.map((slot) => `${slot.section}-${slot.office}`),
  );

  const title = new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="duty-matrix-popover" role="dialog" aria-label={`Назначение: ${userName}`}>
      <div className="duty-matrix-popover__header">
        <p className="duty-matrix-popover__title">
          {userName} · {title}
        </p>
        <button
          type="button"
          className="duty-matrix-popover__close"
          aria-label="Закрыть"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {isLoading ? <p className="duty-matrix-popover__hint">Загрузка…</p> : null}

      {!isLoading && isAbsent ? (
        <p className="duty-matrix-popover__error">
          {targetUser?.absenceType
            ? `${userName} отсутствует (${targetUser.absenceType})`
            : `${userName} отсутствует в этот день`}
        </p>
      ) : null}

      {!isLoading && !isAbsent ? (
        <>
          <div className="duty-matrix-popover__slots">
            {DUTY_SECTIONS.map((section) => (
              <ul key={section.id} className="duty-matrix-popover__slots-row">
                {section.offices.map((office) => {
                  const isFree = freeSlotKeys.has(`${section.id}-${office.code}`);

                  return (
                    <li key={office.code}>
                      <button
                        type="button"
                        className="duty-matrix-popover__slot-btn"
                        disabled={!isFree}
                        onClick={() => onAssign(section.id, office.code)}
                      >
                        {office.code}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>

          {freeSlots.length === 0 ? (
            <p className="duty-matrix-popover__hint">Все кабинеты на этот день заняты</p>
          ) : null}

          {hasAssignment ? (
            <button type="button" className="duty-matrix-popover__clear" onClick={onClear}>
              Снять дежурство
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
