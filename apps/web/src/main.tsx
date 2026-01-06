import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  // Register service worker with safety: if it fails (often due to cached workbox chunk),
  // automatically unregister old SWs + clear caches so the app recovers without manual user steps.
  if ('serviceWorker' in navigator) {
    registerSW({
      immediate: true,
      onRegisterError(error) {
        console.warn('[PWA] Service worker registration failed. Cleaning up...', error);
        Promise.all([
          navigator.serviceWorker.getRegistrations().then((regs) => Promise.all(regs.map((r) => r.unregister()))),
          (typeof caches !== 'undefined'
            ? caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            : Promise.resolve()),
        ])
          .catch((e) => console.warn('[PWA] Cleanup failed:', e))
          .finally(() => {
            // Reload once after cleanup to fetch fresh assets
            try {
              window.location.reload();
            } catch {
              // ignore
            }
          });
      },
    });
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>Error Loading App</h1>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
      <p>Check the browser console for more details.</p>
    </div>
  `;
}
