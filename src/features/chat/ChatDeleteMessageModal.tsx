import type { ChatDeleteMessageMode } from '@/shared/api/types';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

type Props = {
  open: boolean;
  mode: ChatDeleteMessageMode | null;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

const COPY: Record<
  ChatDeleteMessageMode,
  { title: string; body: string; confirm: string; pending: string }
> = {
  everyone: {
    title: 'Удалить сообщение у всех?',
    body: 'Текст и вложения исчезнут у всех участников чата. Вместо сообщения останется отметка «Сообщение удалено».',
    confirm: 'Удалить у всех',
    pending: 'Удаление…',
  },
  me: {
    title: 'Удалить у себя?',
    body: 'Сообщение скроется только в вашей ленте. Другие участники по-прежнему его увидят.',
    confirm: 'Удалить у меня',
    pending: 'Скрытие…',
  },
};

export function ChatDeleteMessageModal({ open, mode, isPending, onConfirm, onClose }: Props) {
  if (!mode) return null;

  const text = COPY[mode];

  return (
    <Modal
      open={open}
      title={text.title}
      onClose={() => {
        if (!isPending) onClose();
      }}
      footer={
        <div className="modal__footer-actions">
          <Button variant="secondary" disabled={isPending} onClick={onClose}>
            Отмена
          </Button>
          <Button variant="danger" disabled={isPending} onClick={onConfirm}>
            {isPending ? text.pending : text.confirm}
          </Button>
        </div>
      }
    >
      <p>{text.body}</p>
    </Modal>
  );
}
