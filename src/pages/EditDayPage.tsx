import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import { ApiError, apiRequest } from '@/shared/api/client';
import type { ApprovedUserForAssign, DaySchedule } from '@/shared/api/types';
import { DUTY_SECTIONS } from '@/shared/constants/offices';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

type SlotValue = { section: 'A' | 'B'; office: string; userId: string | null };

function slotsFromDayData(dayData: DaySchedule): SlotValue[] {
  const next: SlotValue[] = [];
  for (const section of dayData.sections) {
    for (const office of section.offices) {
      next.push({
        section: section.id,
        office: office.office,
        userId: office.user?.id ?? null,
      });
    }
  }
  return next;
}

export function EditDayPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<SlotValue[]>([]);
  const [expectedRevision, setExpectedRevision] = useState(0);
  const [conflictRevision, setConflictRevision] = useState<number | null>(null);

  const {
    data: dayData,
    isLoading,
    error: dayError,
  } = useQuery({
    queryKey: ['schedule', 'day', date],
    queryFn: () => apiRequest<DaySchedule>(`/schedule/day/${date}`),
    enabled: Boolean(date),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users', 'approved', date],
    queryFn: () => apiRequest<{ users: ApprovedUserForAssign[] }>(`/users?date=${date}`),
    enabled: Boolean(date),
  });

  useEffect(() => {
    if (!dayData) return;
    setExpectedRevision(dayData.revision);
    setSlots(slotsFromDayData(dayData));
  }, [dayData]);

  const saveMutation = useMutation({
    mutationFn: (revision: number) =>
      apiRequest<DaySchedule>(`/schedule/day/${date}`, {
        method: 'PUT',
        body: JSON.stringify({ expectedRevision: revision, assignments: slots }),
      }),
    onSuccess: () => {
      setConflictRevision(null);
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      navigate('/');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        const currentRevision = err.body?.currentRevision;
        if (typeof currentRevision === 'number') {
          setConflictRevision(currentRevision);
        }
      }
    },
  });

  if (!date) {
    return <p>Некорректная дата</p>;
  }

  const title = new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  function updateSlot(section: 'A' | 'B', office: string, userId: string | null) {
    if (userId) {
      const user = usersData?.users.find((u) => u.id === userId);
      if (user?.isAbsent) return;
    }
    setSlots((prev) =>
      prev.map((s) => (s.section === section && s.office === office ? { ...s, userId } : s)),
    );
  }

  async function reloadFromServer() {
    setConflictRevision(null);
    const data = await queryClient.fetchQuery({
      queryKey: ['schedule', 'day', date],
      queryFn: () => apiRequest<DaySchedule>(`/schedule/day/${date}`),
    });
    setExpectedRevision(data.revision);
    setSlots(slotsFromDayData(data));
  }

  function saveWithRevision(revision: number) {
    saveMutation.mutate(revision);
  }

  const saveError =
    saveMutation.error instanceof ApiError && saveMutation.error.status === 409
      ? null
      : saveMutation.error;

  return (
    <div className="edit-day-page">
      <header className="subpage-header">
        <Link to="/" className="subpage-header__back" aria-label="Назад к календарю">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="subpage-header__title">Назначения на {title}</h1>
      </header>

      {isLoading ? <p className="page-loading">Загрузка…</p> : null}
      {dayError ? (
        <p className="form-message form-message--error">{(dayError as Error).message}</p>
      ) : null}

      {!isLoading && !dayError
        ? DUTY_SECTIONS.map((section) => (
            <section key={section.id} className="edit-day-page__section">
              <h2>{section.label}</h2>
              <ul className="edit-day-page__list">
                {section.offices.map((office) => {
                  const slot = slots.find(
                    (s) => s.section === section.id && s.office === office.code,
                  );
                  return (
                    <li key={office.code} className="edit-day-page__row">
                      <label className="edit-day-page__label">Каб. {office.code}</label>
                      <select
                        className="edit-day-page__select"
                        value={slot?.userId ?? ''}
                        onChange={(e) =>
                          updateSlot(
                            section.id,
                            office.code,
                            e.target.value ? e.target.value : null,
                          )
                        }
                      >
                        <option value="">— Не назначен —</option>
                        {usersData?.users.map((u) => (
                          <option key={u.id} value={u.id} disabled={u.isAbsent}>
                            {u.fullName}
                            {u.isAbsent && u.absenceType
                              ? ` (${u.absenceType})`
                              : u.isAbsent
                                ? ' (отсутствует)'
                                : ''}
                          </option>
                        ))}
                      </select>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        : null}

      {saveError ? (
        <p className="form-message form-message--error">{(saveError as Error).message}</p>
      ) : null}

      <Button
        className="edit-day-page__save"
        disabled={saveMutation.isPending || isLoading || Boolean(dayError) || slots.length === 0}
        onClick={() => saveWithRevision(expectedRevision)}
      >
        {saveMutation.isPending ? 'Сохранение…' : 'Сохранить'}
      </Button>

      <Modal
        open={conflictRevision !== null}
        title="График изменён"
        onClose={() => {
          if (!saveMutation.isPending) setConflictRevision(null);
        }}
        footer={
          <div className="modal__footer-actions">
            <Button
              variant="secondary"
              disabled={saveMutation.isPending}
              onClick={() => void reloadFromServer()}
            >
              Загрузить актуальную версию
            </Button>
            <Button
              variant="danger"
              disabled={saveMutation.isPending || conflictRevision === null}
              onClick={() => {
                if (conflictRevision !== null) saveWithRevision(conflictRevision);
              }}
            >
              {saveMutation.isPending ? 'Сохранение…' : 'Сохранить мои изменения'}
            </Button>
          </div>
        }
      >
        <p>
          Другой администратор уже изменил график на эту дату. Загрузите актуальную версию или
          сохраните свои изменения, перезаписав текущий график.
        </p>
      </Modal>
    </div>
  );
}
