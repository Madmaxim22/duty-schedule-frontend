import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import type { DaySchedule } from '@/shared/api/types';
import { DUTY_SECTIONS } from '@/shared/constants/offices';
import { Button } from '@/shared/ui/Button';

type ApprovedUser = { id: string; fullName: string; email: string };

type SlotValue = { section: 'A' | 'B'; office: string; userId: string | null };

export function EditDayPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<SlotValue[]>([]);

  const { data: dayData, isLoading } = useQuery({
    queryKey: ['schedule', 'day', date],
    queryFn: () => apiRequest<DaySchedule>(`/schedule/day/${date}`),
    enabled: Boolean(date),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users', 'approved'],
    queryFn: () => apiRequest<{ users: ApprovedUser[] }>('/users'),
  });

  useEffect(() => {
    if (!dayData) return;
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
    setSlots(next);
  }, [dayData]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest<DaySchedule>(`/schedule/day/${date}`, {
        method: 'PUT',
        body: JSON.stringify({ assignments: slots }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      navigate('/');
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
    setSlots((prev) =>
      prev.map((s) => (s.section === section && s.office === office ? { ...s, userId } : s)),
    );
  }

  return (
    <div className="edit-day-page">
      <header className="edit-day-page__header">
        <Link to="/" className="edit-day-page__back">
          ← Календарь
        </Link>
        <h1 className="edit-day-page__title">Назначения на {title}</h1>
      </header>

      {isLoading ? <p>Загрузка…</p> : null}

      {DUTY_SECTIONS.map((section) => (
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
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {saveMutation.error ? (
        <p className="form-message form-message--error">
          {(saveMutation.error as Error).message}
        </p>
      ) : null}

      <Button
        className="edit-day-page__save"
        disabled={saveMutation.isPending || slots.length === 0}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending ? 'Сохранение…' : 'Сохранить'}
      </Button>
    </div>
  );
}
