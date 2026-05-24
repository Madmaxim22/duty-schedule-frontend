export function DayDetailSkeleton() {
  return (
    <div className="day-detail day-detail--loading" aria-busy="true" aria-label="Загрузка">
      <div className="day-detail__skeleton-summary" />
      {[0, 1].map((section) => (
        <div key={section} className="day-detail__section-card day-detail__section-card--skeleton">
          <div className="day-detail__skeleton-header" />
          <ul className="day-detail__list">
            {[0, 1, 2].map((row) => (
              <li key={row} className="day-detail__skeleton-row" />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
