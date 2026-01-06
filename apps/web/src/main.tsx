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
  // NUCLEAR OPTION: Clear ALL notification storage immediately on app load
  try {
    sessionStorage.removeItem('demo_notifications');
    localStorage.removeItem('demo_notifications');
    console.log('[main.tsx] ✅ Cleared all notification storage on app startup');
  } catch (e) {
    console.warn('[main.tsx] Failed to clear notification storage:', e);
  }
  
  // NUCLEAR OPTION: Disable sonner toast auto-injection
  // Override window.toast if sonner tries to create it
  if (typeof window !== 'undefined') {
    (window as any).__SONNER_DISABLED__ = true;
    // Prevent sonner from auto-creating toasts
    const originalToast = (window as any).toast;
    if (originalToast) {
      (window as any).toast = () => {}; // Do nothing
    }
  }
  
  // NUCLEAR OPTION: Remove ALL notification DOM elements immediately and continuously
  const removeNotifications = () => {
    try {
      // Remove sonner toasts
      const sonnerToasts = document.querySelectorAll('[data-sonner-toaster], [data-sonner-toast], [data-sonner-toast-wrapper]');
      sonnerToasts.forEach(el => el.remove());
      
      // Remove any elements with toast/notification classes
      const toastElements = document.querySelectorAll('.toast, .toaster, [class*="toast"], [class*="notification"]');
      toastElements.forEach(el => el.remove());
      
      // Remove any elements with toast/notification IDs
      const toastById = document.querySelectorAll('[id*="toast"], [id*="notification"]');
      toastById.forEach(el => el.remove());
      
      // Hide any remaining notification containers
      const containers = document.querySelectorAll('[role="status"], [aria-live]');
      containers.forEach(el => {
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes('pledge') || text.includes('weekly') || text.includes('report')) {
          (el as HTMLElement).style.display = 'none';
          el.remove();
        }
      });
    } catch (e) {
      // Silent fail
    }
  };
  
  // Run immediately
  if (typeof document !== 'undefined') {
    removeNotifications();
    
    // Run after DOM loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', removeNotifications);
    } else {
      removeNotifications();
    }
    
    // Run periodically to catch any that appear later (every 100ms)
    setInterval(removeNotifications, 100);
    
    // Also use MutationObserver to catch new elements as they're added
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        removeNotifications();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
  
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
