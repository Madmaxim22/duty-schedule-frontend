import type { DaySchedule } from '@/shared/api/types';
import { formatSurnameWithInitials } from '@/shared/lib/formatName';

type Props = {
  data: DaySchedule;
};

function itemClassName(mandatory: boolean, filled: boolean) {
  if (!mandatory) return 'day-detail__item';
  return filled
    ? 'day-detail__item day-detail__item--filled'
    : 'day-detail__item day-detail__item--empty';
}

export function DayDetailContent({ data }: Props) {
  return (
    <div className="day-detail">
      {data.sections.map((section) => (
        <section key={section.id} className="day-detail__section">
          <h3 className="day-detail__section-title">{section.label}</h3>
          <ul className="day-detail__list">
            {section.offices.map((office) => (
              <li
                key={`${section.id}-${office.office}`}
                className={itemClassName(office.mandatory, Boolean(office.user))}
              >
                <span className="day-detail__office">
                  Каб. {office.office}
                  {office.mandatory ? (
                    <span className="day-detail__badge day-detail__badge--required">обяз.</span>
                  ) : (
                    <span className="day-detail__badge">необяз.</span>
                  )}
                </span>
                <span className="day-detail__person">
                  {office.user
                    ? formatSurnameWithInitials(office.user.fullName)
                    : 'Не назначен'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
