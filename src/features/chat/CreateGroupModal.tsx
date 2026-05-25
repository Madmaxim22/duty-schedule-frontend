import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createGroupChat, listChatContacts } from '@/shared/api/chat';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { MemberMultiSelect } from './MemberMultiSelect';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CreateGroupModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const contactsQuery = useQuery({
    queryKey: ['chat', 'contacts'],
    queryFn: listChatContacts,
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: () => createGroupChat(title.trim(), memberIds),
    onSuccess: (data) => {
      setTitle('');
      setMemberIds([]);
      setError('');
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      onClose();
      navigate(`/chat/${data.room.id}`);
    },
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (t.length < 1 || t.length > 80) {
      setError('Название от 1 до 80 символов');
      return;
    }
    if (memberIds.length === 0) {
      setError('Выберите хотя бы одного участника');
      return;
    }
    createMutation.mutate();
  }

  const contacts = contactsQuery.data?.contacts ?? [];
  const isBusy = createMutation.isPending;

  return (
    <Modal open={open} title="Новая группа" onClose={onClose}>
      <form className="chat-create-group" onSubmit={handleSubmit}>
        <label className="chat-create-group__label" htmlFor="chat-group-title">
          Название
        </label>
        <input
          id="chat-group-title"
          className="chat-create-group__input"
          type="text"
          maxLength={80}
          value={title}
          disabled={isBusy}
          onChange={(e) => setTitle(e.target.value)}
        />

        <p className="chat-create-group__label">Участники</p>
        {contactsQuery.isLoading ? <p className="page-loading">Загрузка…</p> : null}
        {contactsQuery.error ? (
          <p className="form-message form-message--error">{(contactsQuery.error as Error).message}</p>
        ) : null}
        {!contactsQuery.isLoading && !contactsQuery.error ? (
          <MemberMultiSelect
            contacts={contacts}
            selectedIds={memberIds}
            onChange={setMemberIds}
            disabled={isBusy}
          />
        ) : null}

        {error ? <p className="form-message form-message--error">{error}</p> : null}

        <Button type="submit" disabled={isBusy || !title.trim() || memberIds.length === 0}>
          {isBusy ? '…' : 'Создать'}
        </Button>
      </form>
    </Modal>
  );
}
