import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="app-shell">
      <main className="app-shell__main">
        <Outlet />
      </main>
      <footer className="app-shell__footer">
        Copyright © 2026 Muhomedyarov
      </footer>
    </div>
  );
}
