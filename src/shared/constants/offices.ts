export const DUTY_SECTIONS = [
  {
    id: 'A' as const,
    label: 'Секция 1',
    offices: [
      { code: '51' as const, mandatory: true },
      { code: '52' as const, mandatory: true },
      { code: '53' as const, mandatory: false },
      { code: '54' as const, mandatory: false },
    ],
  },
  {
    id: 'B' as const,
    label: 'Секция 2',
    offices: [
      { code: '31' as const, mandatory: true },
      { code: '32' as const, mandatory: true },
      { code: '33' as const, mandatory: false },
      { code: '34' as const, mandatory: false },
    ],
  },
] as const;

export type DutySectionId = (typeof DUTY_SECTIONS)[number]['id'];
