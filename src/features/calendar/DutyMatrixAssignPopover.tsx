import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import type { ApprovedUserForAssign } from '@/shared/api/types';
import {
  ABSENCE_TYPE_OTHER,
  ABSENCE_TYPES,
} from '@/features/absences/constants';
import { DUTY_SECTIONS } from '@/shared/constants/offices';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
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
  absenceType?: string;
  onMarkAbsent: (absenceType: string) => void;
  onRemoveAbsent: () => void;
  isSaving?: boolean;
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
  absenceType,
  onMarkAbsent,
  onRemoveAbsent,
  isSaving = false,
}: Props) {
  const [typePreset, setTypePreset] = useState<string>(ABSENCE_TYPES[0]);
  const [customType, setCustomType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'approved', date],
    queryFn: () =>
      apiRequest<{ users: ApprovedUserForAssign[] }>(`/users?date=${date}`),
  });

  const targetUser = data?.users.find((u) => u.id === userId);
  const isAbsent = Boolean(absenceType ?? targetUser?.isAbsent);
  const resolvedAbsenceType = absenceType ?? targetUser?.absenceType;
  const freeSlotKeys = new Set(
    freeSlots.map((slot) => `${slot.section}-${slot.office}`),
  );

  const selectedType =
    typePreset === ABSENCE_TYPE_OTHER ? customType.trim() : typePreset;

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
        <>
          <p className="duty-matrix-popover__error">
            {resolvedAbsenceType
              ? `${userName} отсутствует (${resolvedAbsenceType})`
              : `${userName} отсутствует в этот день`}
          </p>
          <button
            type="button"
            className="duty-matrix-popover__clear"
            disabled={isSaving}
            onClick={onRemoveAbsent}
          >
            {isSaving ? 'Сохранение…' : 'Снять отсутствие'}
          </button>
        </>
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
                        disabled={!isFree || isSaving}
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
            <button
              type="button"
              className="duty-matrix-popover__clear"
              disabled={isSaving}
              onClick={onClear}
            >
              Снять дежурство
            </button>
          ) : null}

          <div className="duty-matrix-popover__absence-form">
            <p className="duty-matrix-popover__hint">Или отметить отсутствие</p>
            <select
              className="duty-matrix-popover__select"
              value={typePreset}
              disabled={isSaving}
              onChange={(e) => setTypePreset(e.target.value)}
            >
              {ABSENCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
              <option value={ABSENCE_TYPE_OTHER}>{ABSENCE_TYPE_OTHER}</option>
            </select>
            {typePreset === ABSENCE_TYPE_OTHER ? (
              <Input
                label="Тип"
                value={customType}
                disabled={isSaving}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Например: Отгул"
              />
            ) : null}
            <Button
              variant="secondary"
              disabled={!selectedType || isSaving}
              onClick={() => onMarkAbsent(selectedType)}
            >
              {isSaving ? 'Сохранение…' : 'Отметить отсутствие'}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
