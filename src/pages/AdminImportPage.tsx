import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import { apiRequest } from '@/shared/api/client';
import type { ScheduleImportResult } from '@/shared/api/types';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

type ImportRecord = {
  fio: string;
  info?: Array<{ fulldate: string; title: number | string }>;
  absence?: Array<{ fulldate: string; absenceType: string }>;
};

function normalizeDate(value: string): string {
  return value.slice(0, 10);
}

function collectDatesFromRecords(records: ImportRecord[]): string[] {
  const dates: string[] = [];
  for (const record of records) {
    for (const item of record.info ?? []) {
      dates.push(normalizeDate(String(item.fulldate)));
    }
    for (const item of record.absence ?? []) {
      dates.push(normalizeDate(String(item.fulldate)));
    }
  }
  return dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
}

function defaultRange(dates: string[]): { from: string; to: string } {
  if (dates.length === 0) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const last = new Date(y, now.getMonth() + 1, 0).getDate();
    return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(last).padStart(2, '0')}` };
  }
  const sorted = [...dates].sort();
  return { from: sorted[0]!, to: sorted[sorted.length - 1]! };
}

export function AdminImportPage() {
  const queryClient = useQueryClient();
  const [records, setRecords] = useState<ImportRecord[] | null>(null);
  const [replaceFrom, setReplaceFrom] = useState('');
  const [replaceTo, setReplaceTo] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ScheduleImportResult | null>(null);

  const importHint = useMemo(
    () =>
      'За выбранный период для сотрудников из файла отсутствия будут полностью заменены. Дежурства в этом периоде станут строго как в файле: назначения из JSON применятся, а все остальные назначения за эти даты будут сняты.',
    [],
  );

  const importMutation = useMutation({
    mutationFn: () =>
      apiRequest<ScheduleImportResult>('/schedule/import', {
        method: 'POST',
        body: JSON.stringify({
          replaceFrom,
          replaceTo,
          records,
        }),
      }),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', 'changes'] });
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    setParseError(null);
    setResult(null);

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as unknown;
        const list: ImportRecord[] = Array.isArray(parsed)
          ? parsed
          : parsed && typeof parsed === 'object' && 'records' in parsed
            ? (parsed as { records: ImportRecord[] }).records
            : [parsed as ImportRecord];

        if (!Array.isArray(list) || list.length === 0) {
          throw new Error('Ожидается массив записей или один объект с полем fio');
        }

        const dates = collectDatesFromRecords(list);
        const range = defaultRange(dates);
        setRecords(list);
        setReplaceFrom(range.from);
        setReplaceTo(range.to);
        setFileName(file.name);
      } catch (err) {
        setRecords(null);
        setFileName(null);
        setParseError(err instanceof Error ? err.message : 'Не удалось прочитать JSON');
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  const canImport = Boolean(records?.length && replaceFrom && replaceTo);

  return (
    <div className="admin-import-page">
      <header className="subpage-header">
        <Link to="/" className="subpage-header__back" aria-label="Назад к календарю">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="subpage-header__title">Импорт графика</h1>
      </header>

      <p className="admin-import-page__hint">{importHint}</p>

      <label className="admin-import-page__file-label">
        <span className="admin-import-page__file-text">
          {fileName ? `Файл: ${fileName}` : 'Выберите JSON-файл'}
        </span>
        <input
          type="file"
          accept=".json,application/json"
          className="visually-hidden"
          onChange={handleFileChange}
        />
      </label>

      {parseError ? (
        <p className="form-message form-message--error">{parseError}</p>
      ) : null}

      {records ? (
        <p className="admin-import-page__meta">Записей в файле: {records.length}</p>
      ) : null}

      <div className="admin-import-page__range">
        <Input
          label="Период с"
          type="date"
          value={replaceFrom}
          onChange={(e) => setReplaceFrom(e.target.value)}
        />
        <Input
          label="Период по"
          type="date"
          value={replaceTo}
          onChange={(e) => setReplaceTo(e.target.value)}
        />
      </div>

      {importMutation.error ? (
        <p className="form-message form-message--error">
          {(importMutation.error as Error).message}
        </p>
      ) : null}

      <Button
        disabled={!canImport || importMutation.isPending}
        onClick={() => importMutation.mutate()}
      >
        {importMutation.isPending ? 'Импорт…' : 'Применить импорт'}
      </Button>

      {result ? (
        <section className="admin-import-page__result" aria-live="polite">
          <h2>Результат</h2>
          <ul className="admin-import-page__stats">
            <li>Отсутствий: {result.importedAbsences}</li>
            <li>Дежурств: {result.importedDuties}</li>
            <li>Изменений в журнале: {result.changesRecorded}</li>
          </ul>
          {result.unknownFio.length > 0 ? (
            <>
              <h3>Не найдены в системе</h3>
              <ul>
                {result.unknownFio.map((fio) => (
                  <li key={fio}>{fio}</li>
                ))}
              </ul>
            </>
          ) : null}
          {result.warnings.length > 0 ? (
            <>
              <h3>Предупреждения</h3>
              <ul className="admin-import-page__warnings">
                {result.warnings.map((w, i) => (
                  <li key={`${i}-${w}`}>{w}</li>
                ))}
              </ul>
            </>
          ) : null}
          <Link to="/admin/changes" className="admin-import-page__changes-link">
            Посмотреть изменения
          </Link>
        </section>
      ) : null}
    </div>
  );
}
