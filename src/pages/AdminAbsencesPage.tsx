import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import type { ApprovedUserForAssign } from '@/shared/api/types';
import { ScheduleMonthNav } from '@/features/calendar/ScheduleMonthNav';
import {
  ABSENCE_TYPE_OTHER,
  ABSENCE_TYPES,
} from '@/features/absences/constants';
import {
  useAbsencesQuery,
  useDeleteAbsencesMutation,
  useUpsertAbsencesMutation,
} from '@/features/absences/useAbsences';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Modal } from '@/shared/ui/Modal';
import { SubpageLayout } from '@/shared/ui/SubpageLayout';

function monthBounds(month: Date): { from: string; to: string } {
  const y = month.getFullYear();
  const m = month.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  const mm = String(m + 1).padStart(2, '0');
  return {
    from: `${y}-${mm}-01`,
    to: `${y}-${mm}-${String(last).padStart(2, '0')}`,
  };
}

function formatDay(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  });
}

export function AdminAbsencesPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [userId, setUserId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typePreset, setTypePreset] = useState<string>(ABSENCE_TYPES[0]);
  const [customType, setCustomType] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<{
    userId: string;
    fullName: string;
    date: string;
    absenceType: string;
  } | null>(null);

  const { from, to } = useMemo(() => monthBounds(month), [month]);

  const usersQuery = useQuery({
    queryKey: ['users', 'approved'],
    queryFn: () => apiRequest<{ users: ApprovedUserForAssign[] }>('/users'),
  });

  const absencesQuery = useAbsencesQuery(from, to);
  const upsertMutation = useUpsertAbsencesMutation();
  const deleteMutation = useDeleteAbsencesMutation();

  const approvedUsers = useMemo(
    () =>
      (usersQuery.data?.users ?? [])
        .filter((u) => u.role !== 'admin')
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru')),
    [usersQuery.data?.users],
  );

  const absenceType =
    typePreset === ABSENCE_TYPE_OTHER ? customType.trim() : typePreset;

  const canSubmit =
    Boolean(userId && dateFrom && dateTo && absenceType) &&
    dateFrom <= dateTo &&
    !upsertMutation.isPending;

  function handleSubmit() {
    setResult(null);
    upsertMutation.mutate(
      { userId, dateFrom, dateTo, absenceType },
      {
        onSuccess: (data) => {
          setResult(
            `Отмечено дней: ${data.upserted}. Снято дежурств: ${data.dutiesRemoved}.`,
          );
          setDateFrom('');
          setDateTo('');
        },
      },
    );
  }

  function handleDeleteConfirm() {
    if (!toDelete) return;
    deleteMutation.mutate(
      {
        userId: toDelete.userId,
        dateFrom: toDelete.date,
        dateTo: toDelete.date,
      },
      {
        onSuccess: (data) => {
          setResult(`Удалено записей: ${data.deleted}.`);
          setToDelete(null);
        },
      },
    );
  }

  return (
    <SubpageLayout className="admin-absences-page" title="Отсутствия">
      <p className="admin-absences-page__hint">
        Отметьте нерабочие дни сотрудника. При сохранении существующие дежурства на эти даты
        будут сняты автоматически.
      </p>

      <ScheduleMonthNav month={month} onMonthChange={setMonth} />

      <section className="admin-absences-page__form">
        <h2 className="admin-absences-page__section-title">Добавить отсутствие</h2>

        <label className="admin-absences-page__field">
          <span className="admin-absences-page__label">Сотрудник</span>
          <select
            className="admin-absences-page__select"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">Выберите сотрудника</option>
            {approvedUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </label>

        <div className="admin-absences-page__range">
          <Input
            label="С даты"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="По дату"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <label className="admin-absences-page__field">
          <span className="admin-absences-page__label">Тип отсутствия</span>
          <select
            className="admin-absences-page__select"
            value={typePreset}
            onChange={(e) => setTypePreset(e.target.value)}
          >
            {ABSENCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
            <option value={ABSENCE_TYPE_OTHER}>{ABSENCE_TYPE_OTHER}</option>
          </select>
        </label>

        {typePreset === ABSENCE_TYPE_OTHER ? (
          <Input
            label="Укажите тип"
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            placeholder="Например: Отгул"
          />
        ) : null}

        {upsertMutation.error ? (
          <p className="form-message form-message--error">
            {(upsertMutation.error as Error).message}
          </p>
        ) : null}

        <Button disabled={!canSubmit} onClick={handleSubmit}>
          {upsertMutation.isPending ? 'Сохранение…' : 'Сохранить'}
        </Button>

        {result ? (
          <p className="admin-absences-page__result" aria-live="polite">
            {result}{' '}
            <Link to="/admin/changes" className="admin-absences-page__link">
              Журнал изменений
            </Link>
          </p>
        ) : null}
      </section>

      <section className="admin-absences-page__list">
        <h2 className="admin-absences-page__section-title">
          Отсутствия за {month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
        </h2>

        {absencesQuery.isLoading ? <p className="page-loading">Загрузка…</p> : null}

        {absencesQuery.error ? (
          <p className="form-message form-message--error">
            {(absencesQuery.error as Error).message}
          </p>
        ) : null}

        {absencesQuery.data?.absences.length === 0 && !absencesQuery.isLoading ? (
          <p className="admin-absences-page__empty">Нет отмеченных отсутствий за этот месяц.</p>
        ) : null}

        {absencesQuery.data && absencesQuery.data.absences.length > 0 ? (
          <div className="admin-absences-page__table-wrap">
            <table className="admin-absences-page__table">
              <thead>
                <tr>
                  <th scope="col">Сотрудник</th>
                  <th scope="col">Дата</th>
                  <th scope="col">Тип</th>
                  <th scope="col">
                    <span className="visually-hidden">Действия</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {absencesQuery.data.absences.map((row) => (
                  <tr key={`${row.userId}-${row.date}`}>
                    <td>{row.fullName}</td>
                    <td>{formatDay(row.date)}</td>
                    <td>{row.absenceType}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-absences-page__delete"
                        onClick={() =>
                          setToDelete({
                            userId: row.userId,
                            fullName: row.fullName,
                            date: row.date,
                            absenceType: row.absenceType,
                          })
                        }
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <Modal
        open={toDelete !== null}
        title="Удалить отсутствие?"
        onClose={() => !deleteMutation.isPending && setToDelete(null)}
        footer={
          <div className="modal__footer-actions">
            <Button
              variant="secondary"
              disabled={deleteMutation.isPending}
              onClick={() => setToDelete(null)}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={handleDeleteConfirm}
            >
              {deleteMutation.isPending ? 'Удаление…' : 'Удалить'}
            </Button>
          </div>
        }
      >
        {toDelete ? (
          <p>
            Снять отметку «{toDelete.absenceType}» для {toDelete.fullName} на{' '}
            {formatDay(toDelete.date)}? Дежурства не восстановятся автоматически.
          </p>
        ) : null}
      </Modal>
    </SubpageLayout>
  );
}
