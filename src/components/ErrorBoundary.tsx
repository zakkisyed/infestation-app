import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg gap-4 p-8">
          <div className="text-xl font-bold p-8 bg-brand-card border-4 border-brand-border shadow-[8px_8px_0px_0px_#111111] text-brand-text text-center max-w-lg">
            SOMETHING WENT WRONG.<br />
            <span className="text-sm text-brand-muted mt-2 block font-normal normal-case">
              {this.state.message || 'An unexpected error occurred.'}
            </span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 border-2 border-brand-border font-bold uppercase text-xs tracking-wider bg-brand-text text-brand-bg shadow-[2px_2px_0px_0px_#111111] hover:-translate-y-0.5 transition-transform"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
