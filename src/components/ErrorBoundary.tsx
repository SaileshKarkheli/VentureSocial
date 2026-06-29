import React from 'react';
import { logger } from '../lib/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Uncaught rendering exception captured inside boundary:', { error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-display font-bold text-[#0A192F] mb-4">Something went wrong</h2>
          <p className="text-zinc-500 max-w-sm mb-6 text-sm">
            An unexpected visual rendering exception occurred. Try refreshing the page, or return home.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-[#0A192F] hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg"
            >
              Reload Page
            </button>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/home';
              }} 
              className="px-6 py-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-xl transition-all"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
