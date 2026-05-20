import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';
import { initThemeFromStorage } from './features/settings/theme';
import './index.css';

initThemeFromStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
);
