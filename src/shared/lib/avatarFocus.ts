export const DEFAULT_AVATAR_FOCUS = 50;

export function clampAvatarFocus(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function avatarObjectPosition(
  focusX?: number | null,
  focusY?: number | null,
): string {
  const x = clampAvatarFocus(focusX ?? DEFAULT_AVATAR_FOCUS);
  const y = clampAvatarFocus(focusY ?? DEFAULT_AVATAR_FOCUS);
  return `${x}% ${y}%`;
}

export const avatarImageCoverStyle = {
  objectFit: 'cover' as const,
};

export function avatarImageStyle(focusX?: number | null, focusY?: number | null) {
  return {
    ...avatarImageCoverStyle,
    objectPosition: avatarObjectPosition(focusX, focusY),
  };
}
