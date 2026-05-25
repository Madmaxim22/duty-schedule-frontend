import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { ChatSocketProvider } from '@/features/chat/ChatSocketContext';

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
      <Outlet />
    </ChatSocketProvider>
  );
}
