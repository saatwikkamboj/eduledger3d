import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// --- DIAGNOSTIC MODE --------------------------------------------------------
// If anything throws before/while React mounts, show it directly on screen
// instead of leaving a blank window. Safe to leave in permanently — it only
// activates if something actually goes wrong.
function showFatalError(title, details) {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#05060a;color:#fca5a5;font-family:monospace;">
      <div style="max-width:820px;">
        <h1 style="color:#ff4d6d;font-size:18px;margin-bottom:12px;">${title}</h1>
        <pre style="white-space:pre-wrap;word-break:break-word;background:rgba(255,77,109,0.08);border:1px solid rgba(255,77,109,0.4);border-radius:12px;padding:16px;font-size:12px;line-height:1.5;">${details}</pre>
      </div>
    </div>`;
}

window.addEventListener('error', (event) => {
  showFatalError('EduLedger 3D failed to start', (event.error && event.error.stack) || event.message || String(event));
});

window.addEventListener('unhandledrejection', (event) => {
  showFatalError('EduLedger 3D — unhandled error', (event.reason && event.reason.stack) || String(event.reason));
});

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
} catch (err) {
  showFatalError('EduLedger 3D failed to render', err.stack || String(err));
}
