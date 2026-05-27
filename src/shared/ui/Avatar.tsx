import { useEffect, useState } from 'react';
import { avatarImageStyle } from '@/shared/lib/avatarFocus';
import { resolveAvatarUrl } from '@/shared/lib/avatarUrl';

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]![0]!.toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

type AvatarProps = {
  fullName: string;
  avatarUrl?: string | null;
  focusX?: number | null;
  focusY?: number | null;
  size?: 'sm' | 'md' | 'lg';
  cacheBust?: number;
  className?: string;
};

export function Avatar({
  fullName,
  avatarUrl,
  focusX,
  focusY,
  size = 'sm',
  cacheBust,
  className,
}: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const src = resolveAvatarUrl(avatarUrl, cacheBust);

  useEffect(() => {
    setBroken(false);
  }, [src]);
  const sizeClass =
    size === 'lg' ? 'avatar--lg' : size === 'md' ? 'avatar--md' : 'avatar--sm';
  const classes = ['avatar', sizeClass, className].filter(Boolean).join(' ');

  if (src && !broken) {
    return (
      <img
        src={src}
        alt=""
        className={`${classes} avatar--image`}
        style={avatarImageStyle(focusX, focusY)}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <span className={`${classes} avatar--initials`} aria-hidden>
      {getInitials(fullName)}
    </span>
  );
}
