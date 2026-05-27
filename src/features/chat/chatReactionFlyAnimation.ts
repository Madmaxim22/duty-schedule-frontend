export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Нижняя левая зона пузыря (где появляются чипы реакций). */
function resolveBubbleLandingPoint(bubble: Element): { x: number; y: number } {
  const reactions = bubble.querySelector('.chat-room__reactions');
  if (reactions) {
    const r = reactions.getBoundingClientRect();
    return {
      x: r.left + Math.min(18, r.width * 0.35),
      y: r.top + r.height / 2,
    };
  }

  const footer = bubble.querySelector('.chat-room__bubble-footer');
  if (footer) {
    const f = footer.getBoundingClientRect();
    return {
      x: f.left + 14,
      y: f.bottom - 6,
    };
  }

  const end = bubble.getBoundingClientRect();
  return {
    x: end.left + Math.min(22, Math.max(14, end.width * 0.12)),
    y: end.bottom - 12,
  };
}

export function getChatMessageBubbleLandingPoint(
  messageId: string,
): { x: number; y: number } | null {
  const row = document.querySelector(`[data-chat-message-id="${messageId}"]`);
  const bubble = row?.querySelector('.chat-room__bubble');
  if (!bubble) return null;

  return resolveBubbleLandingPoint(bubble);
}

const RIPPLE_COUNT = 3;
const RIPPLE_STAGGER_MS = 95;
const RIPPLE_DURATION_MS = 520;
const HIT_EFFECTS_MS = RIPPLE_DURATION_MS + (RIPPLE_COUNT - 1) * RIPPLE_STAGGER_MS + 80;

function appendReactionRipples(
  bubble: HTMLElement,
  impact: { x: number; y: number },
): () => void {
  const rect = bubble.getBoundingClientRect();
  const localX = ((impact.x - rect.left) / rect.width) * 100;
  const localY = ((impact.y - rect.top) / rect.height) * 100;

  const layer = document.createElement('div');
  layer.className = 'chat-reaction-hit-effects';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.setProperty('--hit-x', `${localX}%`);
  layer.style.setProperty('--hit-y', `${localY}%`);

  const flash = document.createElement('span');
  flash.className = 'chat-reaction-hit-flash';
  layer.appendChild(flash);

  for (let i = 0; i < RIPPLE_COUNT; i += 1) {
    const ripple = document.createElement('span');
    ripple.className = 'chat-reaction-ripple';
    ripple.style.animationDelay = `${i * RIPPLE_STAGGER_MS}ms`;
    layer.appendChild(ripple);
  }

  bubble.appendChild(layer);

  return () => {
    layer.remove();
  };
}

export function playChatReactionBubbleHit(
  messageId: string,
  impact?: { x: number; y: number },
): void {
  const bubble = document.querySelector(
    `[data-chat-message-id="${messageId}"] .chat-room__bubble`,
  ) as HTMLElement | null;
  if (!bubble) return;

  const point = impact ?? resolveBubbleLandingPoint(bubble);

  bubble.classList.add('chat-room__bubble--reaction-landed');

  const removeRipples = prefersReducedMotion() ? () => {} : appendReactionRipples(bubble, point);

  window.setTimeout(() => {
    bubble.classList.remove('chat-room__bubble--reaction-landed');
    removeRipples();
  }, prefersReducedMotion() ? 300 : HIT_EFFECTS_MS);
}

/** Клон эмодзи: pop «к пользователю», полёт к пузырю, лёгкий отскок при приземлении. */
export function flyReactionEmoji(
  emoji: string,
  from: DOMRect,
  messageId: string,
  onDone?: () => void,
): void {
  const finish = (impact?: { x: number; y: number }) => {
    playChatReactionBubbleHit(messageId, impact);
    onDone?.();
  };

  if (prefersReducedMotion()) {
    finish();
    return;
  }

  const to = getChatMessageBubbleLandingPoint(messageId);
  if (!to) {
    onDone?.();
    return;
  }

  const el = document.createElement('div');
  el.className = 'chat-reaction-fly';
  el.setAttribute('aria-hidden', 'true');
  el.textContent = emoji;

  const startX = from.left + from.width / 2;
  const startY = from.top + from.height / 2;
  el.style.left = `${startX}px`;
  el.style.top = `${startY}px`;
  document.body.appendChild(el);

  const dx = to.x - startX;
  const dy = to.y - startY;

  const anim = el.animate(
    [
      { transform: 'translate(-50%, -50%) scale(0.9)', offset: 0 },
      { transform: 'translate(-50%, -50%) scale(1.45)', offset: 0.12 },
      {
        transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${dy * 0.35}px)) scale(1.2)`,
        offset: 0.45,
      },
      {
        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`,
        offset: 0.82,
      },
      {
        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy - 6}px)) scale(1.08)`,
        offset: 0.9,
      },
      {
        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`,
        offset: 1,
      },
    ],
    { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
  );

  const cleanup = () => {
    el.remove();
  };

  anim.onfinish = () => {
    cleanup();
    finish(to);
  };
  anim.oncancel = () => {
    cleanup();
    onDone?.();
  };
}
