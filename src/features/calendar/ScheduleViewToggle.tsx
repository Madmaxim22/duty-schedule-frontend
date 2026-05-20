export type ScheduleView = 'grid' | 'list';

type Props = {
  view: ScheduleView;
  onChange: (view: ScheduleView) => void;
};

export function ScheduleViewToggle({ view, onChange }: Props) {
  return (
    <div className="schedule-view-toggle" role="group" aria-label="Вид расписания">
      <button
        type="button"
        className={`schedule-view-toggle__btn${view === 'grid' ? ' schedule-view-toggle__btn--active' : ''}`}
        aria-pressed={view === 'grid'}
        onClick={() => onChange('grid')}
      >
        Сетка
      </button>
      <button
        type="button"
        className={`schedule-view-toggle__btn${view === 'list' ? ' schedule-view-toggle__btn--active' : ''}`}
        aria-pressed={view === 'list'}
        onClick={() => onChange('list')}
      >
        Список
      </button>
    </div>
  );
}

const STORAGE_KEY = 'duty-schedule-view';

export function loadScheduleView(): ScheduleView {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'grid' || stored === 'list') return stored;
  } catch {
    /* ignore */
  }
  return 'grid';
}

export function saveScheduleView(view: ScheduleView) {
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    /* ignore */
  }
}
