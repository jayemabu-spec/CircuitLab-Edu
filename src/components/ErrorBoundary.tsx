import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: error?.message ?? 'Unknown error' };
  }

  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full min-h-[300px]">
          <div className="panel max-w-md text-center">
            <h3 className="text-lg font-bold text-white mb-2">3D Lab could not initialize</h3>
            <p className="text-sm text-[#94a3b8] mb-3">
              WebGL may be unavailable in this environment. Your browser likely supports WebGL on a normal desktop.
            </p>
            <p className="text-xs text-[#94a3b8]">Error: {this.state.message}</p>
            <a href="/lab" className="btn-secondary text-sm mt-4 inline-block">
              Back to Lab
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
