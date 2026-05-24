import { useCallback, useState, type CSSProperties } from 'react';

type Particle = {
  id: number;
  offset: number;
  delay: number;
  drift: number;
};

const PARTICLE_COUNT = 16;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useAvatarLikeHeartsBurst() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const burst = useCallback(() => {
    if (prefersReducedMotion()) return;

    const batch = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: Date.now() + i,
      offset: (Math.random() - 0.5) * 36,
      delay: Math.random() * 0.2,
      drift: (Math.random() - 0.5) * 48,
    }));

    setParticles((prev) => [...prev, ...batch]);

    window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !batch.some((b) => b.id === p.id)));
    }, 1400);
  }, []);

  return { particles, burst };
}

type OverlayProps = {
  particles: Particle[];
};

export function AvatarLikeHeartsOverlay({ particles }: OverlayProps) {
  if (particles.length === 0) return null;

  return (
    <div className="avatar-preview__hearts" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="avatar-preview__heart-particle"
          style={
            {
              animationDelay: `${p.delay}s`,
              '--heart-offset': `${p.offset}px`,
              '--heart-drift': `${p.drift}px`,
            } as CSSProperties
          }
        >
          ♥
        </span>
      ))}
    </div>
  );
}
