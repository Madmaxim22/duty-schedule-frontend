import type { DaySchedule } from '@/shared/api/types';
import { formatSurnameWithInitials } from '@/shared/lib/formatName';
import { Avatar } from '@/shared/ui/Avatar';

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
                <span className="day-detail__office">Каб. {office.office}</span>
                <span className="day-detail__person">
                  {office.user ? (
                    <>
                      <Avatar
                        fullName={office.user.fullName}
                        avatarUrl={office.user.avatarUrl}
                        className="day-detail__avatar"
                      />
                      {formatSurnameWithInitials(office.user.fullName)}
                    </>
                  ) : (
                    'Не назначен'
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
