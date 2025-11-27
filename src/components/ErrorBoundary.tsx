import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-900 border border-red-700 rounded-lg p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <h1 className="text-2xl font-bold text-red-600">Application Error</h1>
            </div>
            
            <p className="text-gray-300 mb-4">
              The application encountered an unexpected error and needs to be reloaded.
            </p>

            {this.state.error && (
              <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-700">
                <p className="text-xs font-mono text-gray-400">Error:</p>
                <p className="text-sm text-red-300 font-mono break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {this.state.errorInfo && (
              <details className="mb-4 p-3 bg-gray-800 rounded border border-gray-700">
                <summary className="text-xs font-mono text-gray-400 cursor-pointer">
                  Stack Trace (click to expand)
                </summary>
                <pre className="text-xs text-gray-500 mt-2 overflow-auto max-h-48">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
