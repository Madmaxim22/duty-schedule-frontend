import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="app-shell">
      <main className="app-shell__main">
        <Outlet />
        <footer className="app-shell__footer">
          <span>Copyright © 2026 Muhomedyarov</span>
        </footer>
      </main>
    </div>
  );
}
