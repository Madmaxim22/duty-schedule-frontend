import type { OusOption, StateSecretOption } from '../data/allowances';
import type { RegionalZone } from '../data/regionalCoeffs';
import type { LeadershipPosition } from '../data/leadershipPositions';
import type { Rank } from '../data/ranks';

export function rankSelectOption(rank: Rank): string {
  return rank.label;
}

export function rankSelectHint(rank: Rank | undefined): string | null {
  if (!rank) return null;
  return `Оклад по званию: ${rank.salary.toLocaleString('ru-RU')} ₽`;
}

export function regionalSelectOption(zone: RegionalZone): string {
  const name = zone.shortLabel ?? zone.label;
  return zone.seniorityPercent > 0 ? `${name}, +${zone.seniorityPercent}%` : name;
}

export function regionalSelectHint(zone: RegionalZone | undefined): string | null {
  if (!zone?.shortLabel || zone.shortLabel === zone.label) return null;
  const stazh = zone.seniorityPercent > 0 ? `, стаж +${zone.seniorityPercent}%` : '';
  return `${zone.label}${stazh}`;
}

export function stateSecretSelectOption(option: StateSecretOption): string {
  switch (option.id) {
    case 'secret':
      return 'Секретно (10%)';
    case 'top_secret':
      return 'Сов. секретно (20%)';
    case 'special_importance':
      return 'Особой важности (25%)';
    case 'special_importance_65':
      return 'Особой важности (до 65%)';
    default:
      return option.label;
  }
}

export function stateSecretSelectHint(option: StateSecretOption | undefined): string | null {
  if (!option || option.id === 'none') return null;
  if (option.id === 'special_importance_65') {
    return 'Отдельные должности с доступом к сведениям особой важности';
  }
  return null;
}

export function ousCheckboxLabel(option: OusOption): string {
  if (/%/.test(option.label)) {
    return option.label;
  }
  const value = option.maxPercent ?? option.percent;
  const prefix = option.variable ? 'до ' : '';
  return `${option.label} (${prefix}${value}%)`;
}

export function leadershipSelectOption(position: LeadershipPosition): string {
  return `${position.label} — ${position.percent}%`;
}

export function leadershipSelectHint(position: LeadershipPosition | undefined): string | null {
  if (!position) return null;
  return `Надбавка за руководящую должность: ${position.percent}% (Прил. № 9)`;
}
