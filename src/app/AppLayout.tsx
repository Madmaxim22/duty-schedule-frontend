import { Outlet } from 'react-router-dom';
import { AppVersionFooter } from '@/features/onboarding/AppVersionFooter';

export function AppLayout() {
  return (
    <div className="app-shell">
      <main className="app-shell__main">
        <Outlet />
      </main>
      <footer className="app-shell__footer">
        <span>Copyright © 2026 Muhomedyarov</span>
        <AppVersionFooter />
      </footer>
    </div>
  );
}
