import React, { Component, type ReactNode } from 'react';
import { Icon } from './UI';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
          <div className="max-w-md w-full bg-white dark:bg-surface-dark rounded-2xl shadow-lg p-6 text-center">
            <div className="mb-4">
              <Icon name="error" className="text-6xl text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-text-secondary mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary text-text-main rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

