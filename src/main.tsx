import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';

// Global error handler for debugging
window.addEventListener('error', (event) => {
  // Ignore and prevent propagation of sanitized cross-origin script errors or dev server websocket/HMR errors
  const msg = event.message || '';
  const file = event.filename || '';
  if (
    msg === 'Script error.' || 
    msg.includes('websocket') || 
    msg.includes('WebSocket') || 
    msg.includes('HMR') ||
    file.includes('vite') ||
    !msg
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return;
  }
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100%';
  errorDiv.style.backgroundColor = 'red';
  errorDiv.style.color = 'white';
  errorDiv.style.padding = '10px';
  errorDiv.style.zIndex = '9999';
  errorDiv.innerText = `Error: ${event.message} at ${event.filename}:${event.lineno}`;
  document.body.appendChild(errorDiv);
});

// Legacy window.onerror to suppress browser dev tools / parent iframe error tracking for cross-origin/HMR
window.onerror = function(message, source, lineno, colno, error) {
  const msgStr = String(message || '');
  const srcStr = String(source || '');
  if (
    msgStr === 'Script error.' || 
    msgStr.includes('websocket') || 
    msgStr.includes('WebSocket') || 
    msgStr.includes('HMR') ||
    srcStr.includes('vite') ||
    !message
  ) {
    return true; // Suppress default browser error reporting
  }
  return false;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
