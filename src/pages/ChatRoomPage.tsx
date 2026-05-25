import { useParams } from 'react-router-dom';
import { ChatRoomView } from '@/features/chat/ChatRoomView';

export function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  if (!roomId) {
    return <p className="form-message form-message--error">Чат не найден</p>;
  }
  return <ChatRoomView roomId={roomId} />;
}
