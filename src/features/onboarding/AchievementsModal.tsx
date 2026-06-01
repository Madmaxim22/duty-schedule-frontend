import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { markAchievementsSeen } from '@/shared/api/onboarding';
import type { OnboardingAchievementsBlock } from '@/shared/api/types';

type Props = {
  achievements: OnboardingAchievementsBlock;
  onClose: () => void;
  onSeen: () => void;
};

export function AchievementsModal({ achievements, onClose, onSeen }: Props) {
  const queryClient = useQueryClient();

  const seenMutation = useMutation({
    mutationFn: () => markAchievementsSeen(achievements.period),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      onSeen();
    },
  });

  return (
    <Modal
      open
      title={`Итоги за ${achievements.periodLabel}`}
      onClose={onClose}
      footer={
        <Button
          variant="primary"
          disabled={seenMutation.isPending}
          onClick={() => seenMutation.mutate()}
        >
          {seenMutation.isPending ? '…' : 'Отлично'}
        </Button>
      }
    >
      <div className="onboarding-modal">
        <p className="onboarding-modal__lead">Новые достижения за месяц:</p>
        <ul className="achievement-list">
          {achievements.unseen.map((item) => (
            <li key={item.id} className="achievement-list__item">
              <span className="achievement-list__icon" aria-hidden>
                {item.icon}
              </span>
              <div>
                <p className="achievement-list__title">{item.title}</p>
                <p className="achievement-list__desc">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
        {seenMutation.error ? (
          <p className="form-message form-message--error">
            {(seenMutation.error as Error).message}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
