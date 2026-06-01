import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { ChatSocketProvider } from '@/features/chat/ChatSocketContext';
import { PostLoginModals } from '@/features/onboarding/PostLoginModals';

export function PrivateRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="page-loading">Загрузка…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ChatSocketProvider>
      <PostLoginModals />
      <Outlet />
    </ChatSocketProvider>
  );
}
