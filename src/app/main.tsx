import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initThemeWatcher } from '@/store/uiStore';
import '@/styles/globals.css';

// Apply theme synchronously before first paint to avoid flash.
// We can't fully wait for Zustand persist hydration here, so we read raw
// localStorage with the same key zustand uses.
try {
  const raw = localStorage.getItem('arkd-ui');
  let override: 'light' | 'dark' | null = null;
  if (raw) {
    const parsed = JSON.parse(raw);
    override = parsed?.state?.themeOverride ?? null;
  }
  const isDark =
    override === 'dark' ||
    (override === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    document.documentElement.classList.add('dark');
  }
} catch {
  /* ignore — fallback to default light */
}

// After hydration, set up the system-theme watcher
initThemeWatcher();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
