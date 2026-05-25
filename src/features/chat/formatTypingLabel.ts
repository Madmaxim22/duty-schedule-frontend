function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return 'Участник';
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

/** Текст «Иван печатает…» / «Иван и Мария печатают…» для шапки чата. */
export function formatTypingLabel(names: string[]): string | null {
  if (names.length === 0) return null;
  const parts = names.map(firstName);
  if (parts.length === 1) {
    return `${parts[0]} печатает…`;
  }
  if (parts.length === 2) {
    return `${parts[0]} и ${parts[1]} печатают…`;
  }
  return `${parts[0]} и ещё ${parts.length - 1} печатают…`;
}
