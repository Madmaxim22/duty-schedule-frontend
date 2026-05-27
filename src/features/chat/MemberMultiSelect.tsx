import type { ChatContact } from '@/shared/api/types';
import { Avatar } from '@/shared/ui/Avatar';

type Props = {
  contacts: ChatContact[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function MemberMultiSelect({ contacts, selectedIds, onChange, disabled }: Props) {
  function toggle(id: string) {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <ul className="chat-member-select" role="listbox" aria-multiselectable="true">
      {contacts.map((c) => {
        const checked = selectedIds.includes(c.id);
        return (
          <li key={c.id}>
            <button
              type="button"
              role="option"
              aria-selected={checked}
              className={`chat-member-select__row${checked ? ' chat-member-select__row--selected' : ''}`}
              disabled={disabled}
              onClick={() => toggle(c.id)}
            >
              <Avatar
                fullName={c.fullName}
                avatarUrl={c.avatarUrl}
                focusX={c.avatarFocusX}
                focusY={c.avatarFocusY}
                size="sm"
              />
              <span className="chat-member-select__name">{c.fullName}</span>
              {checked ? <span className="chat-member-select__check">Выбран</span> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
