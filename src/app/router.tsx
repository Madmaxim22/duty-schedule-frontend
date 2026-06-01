import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/AuthContext';
import { PrivateRoute } from './PrivateRoute';
import { AdminRoute } from './AdminRoute';
import { AppLayout } from './AppLayout';
import { DutySwapsPage } from '@/pages/DutySwapsPage';
import { AdminDutySwapsPage } from '@/pages/AdminDutySwapsPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { HomePage } from '@/pages/HomePage';
import { AdminUsersPage } from '@/pages/AdminUsersPage';
import { EditDayPage } from '@/pages/EditDayPage';
import { AdminImportPage } from '@/pages/AdminImportPage';
import { AdminChangesPage } from '@/pages/AdminChangesPage';
import { AdminStatisticsPage } from '@/pages/AdminStatisticsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { UpdatesPage } from '@/pages/UpdatesPage';
import { SupportPage } from '@/pages/SupportPage';
import { SupportThreadPage } from '@/pages/SupportThreadPage';
import { AdminSupportPage } from '@/pages/AdminSupportPage';
import { AdminSupportThreadPage } from '@/pages/AdminSupportThreadPage';
import { ChatPage } from '@/pages/ChatPage';
import { ChatRoomPage } from '@/pages/ChatRoomPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/updates" element={<UpdatesPage />} />
              <Route path="/duty-swaps" element={<DutySwapsPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/support/:threadId" element={<SupportThreadPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chat/:roomId" element={<ChatRoomPage />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/support" element={<AdminSupportPage />} />
                <Route path="/admin/support/:threadId" element={<AdminSupportThreadPage />} />
                <Route path="/admin/import" element={<AdminImportPage />} />
                <Route path="/admin/changes" element={<AdminChangesPage />} />
                <Route path="/admin/statistics" element={<AdminStatisticsPage />} />
                <Route path="/admin/duty-swaps" element={<AdminDutySwapsPage />} />
                <Route path="/admin/schedule/:date" element={<EditDayPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
