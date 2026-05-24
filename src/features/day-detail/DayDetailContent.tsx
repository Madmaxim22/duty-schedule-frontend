import type { DaySchedule } from '@/shared/api/types';
import { formatSurnameWithInitials } from '@/shared/lib/formatName';
import { Avatar } from '@/shared/ui/Avatar';
import type { DutyProfileTarget } from '@/features/profile/dutyProfileTarget';
import { toAvatarPreviewUser, type AvatarPreviewUser } from './avatarPreviewUser';

export type { AvatarPreviewUser };

type Props = {
  data: DaySchedule;
  isAdmin?: boolean;
  onAvatarPreview?: (user: AvatarPreviewUser) => void;
  onUserProfile?: (target: DutyProfileTarget) => void;
};

function itemClassName(isAdmin: boolean, mandatory: boolean, filled: boolean) {
  if (!isAdmin) return 'day-detail__item day-detail__item--filled';
  if (!mandatory) return 'day-detail__item';
  return filled
    ? 'day-detail__item day-detail__item--filled'
    : 'day-detail__item day-detail__item--empty';
}

function DutyPerson({
  user,
  onAvatarPreview,
  onUserProfile,
}: {
  user: NonNullable<DaySchedule['sections'][number]['offices'][number]['user']>;
  onAvatarPreview?: (user: AvatarPreviewUser) => void;
  onUserProfile?: (target: DutyProfileTarget) => void;
}) {
  const preview = toAvatarPreviewUser(user);
  const openPreview = () => {
    if (preview && onAvatarPreview) onAvatarPreview(preview);
  };
  const openProfile = () => {
    if (onUserProfile) {
      onUserProfile({
        userId: user.id,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        currentPhotoId: user.currentPhotoId,
      });
    }
  };
  const name = formatSurnameWithInitials(user.fullName);

  return (
    <>
      {preview && onAvatarPreview ? (
        <button
          type="button"
          className="day-detail__avatar-btn"
          aria-label={`Показать фото: ${user.fullName}`}
          onClick={openPreview}
        >
          <Avatar
            fullName={user.fullName}
            avatarUrl={user.avatarUrl}
            className="day-detail__avatar"
          />
        </button>
      ) : (
        <Avatar
          fullName={user.fullName}
          avatarUrl={user.avatarUrl}
          className="day-detail__avatar"
        />
      )}
      {onUserProfile ? (
        <button type="button" className="day-detail__name-btn" onClick={openProfile}>
          {name}
        </button>
      ) : (
        name
      )}
    </>
  );
}

export function DayDetailContent({ data, isAdmin = false, onAvatarPreview, onUserProfile }: Props) {
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
      {data.myAbsence ? (
        <p className="day-detail__absence-banner" role="status">
          {data.myAbsence.type}
        </p>
      ) : null}
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
                    <DutyPerson
                      user={office.user}
                      onAvatarPreview={onAvatarPreview}
                      onUserProfile={onUserProfile}
                    />
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
