import { useParams } from 'react-router-dom';
import { SupportThreadView } from '@/features/support/SupportThreadView';

export function SupportThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  if (!threadId) return null;
  return <SupportThreadView threadId={threadId} isAdmin={false} />;
}
