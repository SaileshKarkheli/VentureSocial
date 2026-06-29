import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppProvider } from './AppContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { logger } from './lib/logger.ts';

if (typeof window !== 'undefined') {
  window.onerror = (message, source, lineno, colno, error) => {
    logger.error('Global uncaught exception captured:', {
      message: String(message),
      source,
      lineno,
      colno,
      error
    });
    return false;
  };

  window.onunhandledrejection = (event) => {
    logger.error('Global unhandled promise rejection captured:', {
      reason: event.reason instanceof Error ? { message: event.reason.message, stack: event.reason.stack } : event.reason
    });
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
