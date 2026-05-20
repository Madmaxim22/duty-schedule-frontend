import type { DaySchedule } from '@/shared/api/types';
import { formatSurnameWithInitials } from '@/shared/lib/formatName';
import { Avatar } from '@/shared/ui/Avatar';

type Props = {
  data: DaySchedule;
  isAdmin?: boolean;
};

function itemClassName(isAdmin: boolean, mandatory: boolean, filled: boolean) {
  if (!isAdmin) return 'day-detail__item day-detail__item--filled';
  if (!mandatory) return 'day-detail__item';
  return filled
    ? 'day-detail__item day-detail__item--filled'
    : 'day-detail__item day-detail__item--empty';
}

export function DayDetailContent({ data, isAdmin = false }: Props) {
  const sections = data.sections
    .map((section) => ({
      ...section,
      offices: isAdmin ? section.offices : section.offices.filter((office) => office.user),
    }))
    .filter((section) => section.offices.length > 0);

  if (sections.length === 0) {
    return <p className="day-detail__empty">На этот день дежурств не назначено</p>;
  }

  return (
    <div className="day-detail">
      {sections.map((section, index) => (
        <div key={section.id} className="day-detail__section">
          {index > 0 ? <div className="day-detail__divider" role="separator" /> : null}
          <ul className="day-detail__list">
            {section.offices.map((office) => (
              <li
                key={`${section.id}-${office.office}`}
                className={itemClassName(isAdmin, office.mandatory, Boolean(office.user))}
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
        </div>
      ))}
    </div>
  );
}
