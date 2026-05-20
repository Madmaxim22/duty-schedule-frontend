type Props = {
  orientation: 'left' | 'right';
  className?: string;
};

/** Шеврон как в react-day-picker (rdp-chevron). */
export function MonthNavChevron({ orientation, className }: Props) {
  return (
    <svg
      className={className}
      width={24}
      height={24}
      viewBox="0 0 24 24"
      aria-hidden
    >
      {orientation === 'left' ? (
        <polygon points="16 18.112 9.81111111 12 16 5.87733333 14.0888889 4 6 12 14.0888889 20" />
      ) : (
        <polygon points="8 18.112 14.18888889 12 8 5.87733333 9.91111111 4 18 12 9.91111111 20" />
      )}
    </svg>
  );
}
