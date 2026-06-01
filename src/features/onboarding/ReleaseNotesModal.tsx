import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { acknowledgeRelease } from '@/shared/api/onboarding';
import type { OnboardingRelease } from '@/shared/api/types';
import { ReleaseNotesList } from './ReleaseNotesList';

type Props = {
  release: OnboardingRelease;
  onClose: () => void;
  onAcknowledged: () => void;
};

export function ReleaseNotesModal({ release, onClose, onAcknowledged }: Props) {
  const queryClient = useQueryClient();

  const ackMutation = useMutation({
    mutationFn: () => acknowledgeRelease(release.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      onAcknowledged();
    },
  });

  function handleConfirm() {
    ackMutation.mutate();
  }

  return (
    <Modal
      open
      title="Что нового"
      onClose={onClose}
      footer={
        <Button
          variant="primary"
          disabled={ackMutation.isPending}
          onClick={handleConfirm}
        >
          {ackMutation.isPending ? '…' : 'Понятно'}
        </Button>
      }
    >
      <div className="onboarding-modal">
        <ReleaseNotesList release={release} isCurrent />
        {ackMutation.error ? (
          <p className="form-message form-message--error">
            {(ackMutation.error as Error).message}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
