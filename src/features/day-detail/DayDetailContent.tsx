import type { DaySchedule } from '@/shared/api/types';
import { formatSurnameWithInitials } from '@/shared/lib/formatName';
import { Avatar } from '@/shared/ui/Avatar';
import type { DutyProfileTarget } from '@/features/profile/dutyProfileTarget';
import { toAvatarPreviewUser, type AvatarPreviewUser } from './avatarPreviewUser';
import {
  AbsenceIcon,
  AlertCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
} from './DayDetailIcons';

export type { AvatarPreviewUser };

export type DayDetailSwapSlot = {
  date: string;
  section: 'A' | 'B';
  office: string;
  userId: string;
  fullName: string;
};

type Props = {
  data: DaySchedule;
  isAdmin?: boolean;
  currentUserId?: string;
  onAvatarPreview?: (user: AvatarPreviewUser) => void;
  onUserProfile?: (target: DutyProfileTarget) => void;
  onProposeSwap?: (counterpartySlot: DayDetailSwapSlot) => void;
};

type OfficeRow = DaySchedule['sections'][number]['offices'][number];

function rowClassName(isAdmin: boolean, office: OfficeRow) {
  if (office.user) return 'day-detail__row day-detail__row--filled';
  if (!isAdmin) return 'day-detail__row day-detail__row--filled';
  if (office.mandatory) return 'day-detail__row day-detail__row--empty-mandatory';
  return 'day-detail__row day-detail__row--empty-optional';
}

function DutyPerson({
  user,
  onAvatarPreview,
  onUserProfile,
}: {
  user: NonNullable<OfficeRow['user']>;
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
        avatarFocusX: user.avatarFocusX,
        avatarFocusY: user.avatarFocusY,
      });
    }
  };
  const name = formatSurnameWithInitials(user.fullName);

  return (
    <div className="day-detail__person">
      {preview && onAvatarPreview ? (
        <button
          type="button"
          className="day-detail__avatar-btn"
          aria-label={`Показать фото: ${user.fullName}`}
          onClick={(e) => {
            e.stopPropagation();
            openPreview();
          }}
        >
          <Avatar
            fullName={user.fullName}
            avatarUrl={user.avatarUrl}
            focusX={user.avatarFocusX}
            focusY={user.avatarFocusY}
            className="day-detail__avatar"
          />
        </button>
      ) : (
        <Avatar
          fullName={user.fullName}
          avatarUrl={user.avatarUrl}
          focusX={user.avatarFocusX}
          focusY={user.avatarFocusY}
          className="day-detail__avatar"
        />
      )}
      {onUserProfile ? (
        <button
          type="button"
          className="day-detail__name-btn"
          onClick={(e) => {
            e.stopPropagation();
            openProfile();
          }}
        >
          {name}
        </button>
      ) : (
        <span className="day-detail__name">{name}</span>
      )}
    </div>
  );
}

function DayDetailSummary({
  assigned,
  total,
  missingMandatory,
}: {
  assigned: number;
  total: number;
  missingMandatory: number;
}) {
  const complete = missingMandatory === 0;

  return (
    <div className="day-detail__summary" role="status">
      <span className="day-detail__summary-count">
        {assigned} из {total} назначено
      </span>
      {complete ? (
        <span className="day-detail__summary-badge day-detail__summary-badge--ok">
          <CheckCircleIcon className="day-detail__summary-badge-icon" />
          Все назначены
        </span>
      ) : (
        <span className="day-detail__summary-badge day-detail__summary-badge--warn">
          <AlertCircleIcon className="day-detail__summary-badge-icon" />
          {missingMandatory}{' '}
          {missingMandatory === 1 ? 'пропуск' : missingMandatory < 5 ? 'пропуска' : 'пропусков'}
        </span>
      )}
    </div>
  );
}

function canSwapWithRow(
  office: OfficeRow,
  currentUserId: string | undefined,
  isAdmin: boolean,
  onProposeSwap?: (slot: DayDetailSwapSlot) => void,
): office is OfficeRow & { user: NonNullable<OfficeRow['user']> } {
  return (
    Boolean(onProposeSwap && currentUserId && !isAdmin && office.user) &&
    office.user!.id !== currentUserId
  );
}

export function DayDetailContent({
  data,
  isAdmin = false,
  currentUserId,
  onAvatarPreview,
  onUserProfile,
  onProposeSwap,
}: Props) {
  const sections = data.sections
    .map((section) => ({
      ...section,
      offices: isAdmin ? section.offices : section.offices.filter((office) => office.user),
    }))
    .filter((section) => section.offices.length > 0);

  const allOffices = data.sections.flatMap((section) => section.offices);
  const assignedCount = allOffices.filter((office) => office.user).length;
  const totalCount = allOffices.length;
  const missingMandatory = allOffices.filter((office) => office.mandatory && !office.user).length;

  const hasSwapableRows = !isAdmin && Boolean(onProposeSwap && currentUserId);

  if (sections.length === 0) {
    return (
      <div className="day-detail__empty-state">
        <CalendarIcon className="day-detail__empty-icon" />
        <p className="day-detail__empty">На этот день дежурств не назначено</p>
      </div>
    );
  }

  return (
    <div className="day-detail">
      {hasSwapableRows ? (
        <p className="day-detail__swap-hint">Нажмите на дежурство коллеги, чтобы предложить смену</p>
      ) : null}
      {data.myAbsence ? (
        <p className="day-detail__absence-banner" role="status">
          <AbsenceIcon className="day-detail__absence-icon" />
          <span>{data.myAbsence.type}</span>
        </p>
      ) : null}

      {isAdmin ? (
        <DayDetailSummary
          assigned={assignedCount}
          total={totalCount}
          missingMandatory={missingMandatory}
        />
      ) : null}

      {sections.map((section) => {
        const sectionAssigned = section.offices.filter((office) => office.user).length;

        return (
          <section key={section.id} className="day-detail__section-card" aria-label={section.label}>
            <header className="day-detail__section-header">
              <h3 className="day-detail__section-title">{section.label}</h3>
              {isAdmin ? (
                <span className="day-detail__section-counter">
                  {sectionAssigned}/{section.offices.length}
                </span>
              ) : null}
            </header>
            <ul className="day-detail__list">
              {section.offices.map((office) => {
                const swapable = canSwapWithRow(office, currentUserId, isAdmin, onProposeSwap);

                function openSwap() {
                  if (!swapable || !onProposeSwap) return;
                  onProposeSwap({
                    date: data.date,
                    section: office.section,
                    office: office.office,
                    userId: office.user.id,
                    fullName: office.user.fullName,
                  });
                }

                return (
                  <li
                    key={`${section.id}-${office.office}`}
                    className={`${rowClassName(isAdmin, office)}${
                      swapable ? ' day-detail__row--swapable' : ''
                    }`}
                    {...(swapable
                      ? {
                          role: 'button' as const,
                          tabIndex: 0,
                          onClick: openSwap,
                          onKeyDown: (e: React.KeyboardEvent) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openSwap();
                            }
                          },
                          'aria-label': `${office.user.fullName}, кабинет ${office.office}`,
                        }
                      : {})}
                  >
                    <span className="day-detail__office-badge">Каб. {office.office}</span>
                    <div className="day-detail__row-body">
                      {office.user ? (
                        <DutyPerson
                          user={office.user}
                          onAvatarPreview={onAvatarPreview}
                          onUserProfile={onUserProfile}
                        />
                      ) : (
                        <span className="day-detail__unassigned">
                          {office.mandatory ? 'Не назначен' : '—'}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
