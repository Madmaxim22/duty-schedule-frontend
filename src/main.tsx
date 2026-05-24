import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';
import { initThemeFromStorage } from './features/settings/theme';
import { initPwaIconFromStorage } from './features/settings/pwa-icon';
import './index.css';

initThemeFromStorage();
initPwaIconFromStorage();

if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
    console.warn('[sw] registration failed', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
);
