import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import { createDirectChat, listChatContacts, listChatRooms } from '@/shared/api/chat';
import { ChatList } from '@/features/chat/ChatList';
import { CreateGroupModal } from '@/features/chat/CreateGroupModal';
import { Modal } from '@/shared/ui/Modal';
import { Avatar } from '@/shared/ui/Avatar';
import type { ChatContact } from '@/shared/api/types';

function ContactRow({
  contact,
  onSelect,
  disabled,
}: {
  contact: ChatContact;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="chat-page__contact-row"
      disabled={disabled}
      onClick={() => onSelect(contact.id)}
    >
      <Avatar fullName={contact.fullName} avatarUrl={contact.avatarUrl} size="md" />
      <span>{contact.fullName}</span>
    </button>
  );
}

function ComposeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        fill="currentColor"
      />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ChatPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [groupOpen, setGroupOpen] = useState(false);
  const [directOpen, setDirectOpen] = useState(false);

  const roomsQuery = useQuery({
    queryKey: ['chat', 'rooms'],
    queryFn: listChatRooms,
  });

  const contactsQuery = useQuery({
    queryKey: ['chat', 'contacts'],
    queryFn: listChatContacts,
    enabled: directOpen,
  });

  const directMutation = useMutation({
    mutationFn: (userId: string) => createDirectChat(userId),
    onSuccess: (data) => {
      setDirectOpen(false);
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      navigate(`/chat/${data.room.id}`);
    },
  });

  const rooms = roomsQuery.data?.rooms ?? [];
  const contacts = contactsQuery.data?.contacts ?? [];

  return (
    <div className="chat-page chat-page--telegram">
      <header className="chat-page__header">
        <Link to="/" className="chat-page__back" aria-label="Назад к календарю">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="chat-page__title">Чаты</h1>
        <div className="chat-page__header-actions">
          <button
            type="button"
            className="chat-page__icon-btn"
            aria-label="Новый диалог"
            onClick={() => setDirectOpen(true)}
          >
            <ComposeIcon />
          </button>
          <button
            type="button"
            className="chat-page__icon-btn"
            aria-label="Новая группа"
            onClick={() => setGroupOpen(true)}
          >
            <GroupIcon />
          </button>
        </div>
      </header>

      {roomsQuery.error ? (
        <p className="form-message form-message--error chat-page__error">{(roomsQuery.error as Error).message}</p>
      ) : null}

      <ChatList rooms={rooms} loading={roomsQuery.isLoading} />

      <CreateGroupModal open={groupOpen} onClose={() => setGroupOpen(false)} />

      <Modal open={directOpen} title="Новый чат" onClose={() => setDirectOpen(false)}>
        {contactsQuery.isLoading ? <p className="page-loading">Загрузка…</p> : null}
        {contactsQuery.error ? (
          <p className="form-message form-message--error">{(contactsQuery.error as Error).message}</p>
        ) : null}
        {directMutation.error ? (
          <p className="form-message form-message--error">{(directMutation.error as Error).message}</p>
        ) : null}
        {!contactsQuery.isLoading && !contactsQuery.error ? (
          <ul className="chat-page__contacts">
            {contacts.map((c) => (
              <li key={c.id}>
                <ContactRow
                  contact={c}
                  disabled={directMutation.isPending}
                  onSelect={(id) => directMutation.mutate(id)}
                />
              </li>
            ))}
          </ul>
        ) : null}
        {contacts.length === 0 && !contactsQuery.isLoading ? (
          <p className="chat-page__empty">Нет других участников</p>
        ) : null}
      </Modal>
    </div>
  );
}
