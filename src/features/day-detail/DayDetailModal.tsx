import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/shared/api/client';
import type { DaySchedule } from '@/shared/api/types';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { AvatarPreviewModal } from './AvatarPreviewModal';
import { DayDetailContent, type AvatarPreviewUser } from './DayDetailContent';
import { useAuth } from '@/features/auth/AuthContext';

type Props = {
  date: string | null;
  onClose: () => void;
};

function formatTitle(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function DayDetailModal({ date, onClose }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [previewUser, setPreviewUser] = useState<AvatarPreviewUser | null>(null);

  useEffect(() => {
    if (!date) setPreviewUser(null);
  }, [date]);

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

  return (
    <>
      <Modal
        open={Boolean(date)}
        title={date ? formatTitle(date) : ''}
        onClose={onClose}
        closeOnEscape={!previewUser}
        footer={footer}
      >
        {isLoading ? <p>Загрузка…</p> : null}
        {error ? (
          <p className="form-message form-message--error">{(error as Error).message}</p>
        ) : null}
        {data ? (
          <DayDetailContent
            data={data}
            isAdmin={user?.role === 'admin'}
            onAvatarPreview={setPreviewUser}
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
    </>
  );
}
