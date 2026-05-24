import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/shared/api/client';
import type { DaySchedule } from '@/shared/api/types';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { AvatarPreviewModal } from './AvatarPreviewModal';
import { DayDetailContent, type AvatarPreviewUser } from './DayDetailContent';
import { DayDetailSkeleton } from './DayDetailSkeleton';
import { UserProfileModal } from '@/features/profile/UserProfileModal';
import type { DutyProfileTarget } from '@/features/profile/dutyProfileTarget';
import { useAuth } from '@/features/auth/AuthContext';

type Props = {
  date: string | null;
  onClose: () => void;
  onUserProfile?: (target: DutyProfileTarget) => void;
};

function formatTitle(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatWeekday(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  const weekday = d.toLocaleDateString('ru-RU', { weekday: 'long' });
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

export function DayDetailModal({ date, onClose, onUserProfile }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [previewUser, setPreviewUser] = useState<AvatarPreviewUser | null>(null);
  const [profileTarget, setProfileTarget] = useState<DutyProfileTarget | null>(null);

  useEffect(() => {
    if (!date) {
      setPreviewUser(null);
      setProfileTarget(null);
    }
  }, [date]);

  function handleUserProfile(target: DutyProfileTarget) {
    if (target.userId === user?.id) {
      onUserProfile?.(target);
      return;
    }
    setProfileTarget(target);
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['schedule', 'day', date],
    queryFn: () => apiRequest<DaySchedule>(`/schedule/day/${date}`),
    enabled: Boolean(date),
  });

  const footer =
    user?.role === 'admin' && date ? (
      <Button
        variant="primary"
        onClick={() => {
          onClose();
          navigate(`/admin/schedule/${date}`);
        }}
      >
        Редактировать
      </Button>
    ) : undefined;

  const modalTitle = date ? (
    <>
      <span className="day-detail-modal__title-date">{formatTitle(date)}</span>
      <span className="day-detail-modal__title-weekday">{formatWeekday(date)}</span>
    </>
  ) : (
    ''
  );

  return (
    <>
      <Modal
        open={Boolean(date)}
        title={modalTitle}
        onClose={onClose}
        closeOnEscape={!previewUser && !profileTarget}
        footer={footer}
        titleClassName="day-detail-modal__title"
      >
        {isLoading ? <DayDetailSkeleton /> : null}
        {error ? (
          <p className="form-message form-message--error">{(error as Error).message}</p>
        ) : null}
        {data ? (
          <DayDetailContent
            data={data}
            isAdmin={user?.role === 'admin'}
            onAvatarPreview={setPreviewUser}
            onUserProfile={handleUserProfile}
          />
        ) : null}
      </Modal>
      <AvatarPreviewModal
        open={Boolean(previewUser)}
        photoId={previewUser?.photoId}
        targetUserId={previewUser?.targetUserId}
        currentUserId={user?.id}
        fullName={previewUser?.fullName ?? ''}
        avatarUrl={previewUser?.avatarUrl ?? null}
        onClose={() => setPreviewUser(null)}
      />
      <UserProfileModal
        target={profileTarget}
        onClose={() => setProfileTarget(null)}
      />
    </>
  );
}
