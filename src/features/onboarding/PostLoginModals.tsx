import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOnboarding } from '@/shared/api/onboarding';
import { ReleaseNotesModal } from './ReleaseNotesModal';
import { AchievementsModal } from './AchievementsModal';

type Step = 'idle' | 'release' | 'achievements' | 'done';

export function PostLoginModals() {
  const { data, isSuccess } = useQuery({
    queryKey: ['onboarding'],
    queryFn: fetchOnboarding,
    staleTime: 60_000,
  });

  const [step, setStep] = useState<Step>('idle');

  useEffect(() => {
    if (!isSuccess || !data) return;
    if (step !== 'idle') return;

    if (data.release?.needsAck) {
      setStep('release');
      return;
    }
    if (data.achievements?.unseen.length) {
      setStep('achievements');
      return;
    }
    setStep('done');
  }, [isSuccess, data, step]);

  function afterRelease() {
    if (data?.achievements?.unseen.length) {
      setStep('achievements');
    } else {
      setStep('done');
    }
  }

  if (step === 'release' && data?.release?.needsAck) {
    return (
      <ReleaseNotesModal
        release={data.release}
        onClose={() => setStep('done')}
        onAcknowledged={afterRelease}
      />
    );
  }

  if (step === 'achievements' && data?.achievements?.unseen.length) {
    return (
      <AchievementsModal
        achievements={data.achievements}
        onClose={() => setStep('done')}
        onSeen={() => setStep('done')}
      />
    );
  }

  return null;
}
