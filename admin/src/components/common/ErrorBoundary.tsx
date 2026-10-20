import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-8 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h1>

            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
              {this.props.fallbackMessage ||
                "An unexpected rendering error occurred. The screen has been safely recovered without crashing."}
            </p>

            {this.state.error?.message && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6 text-left">
                <p className="text-xs font-mono text-red-700 dark:text-red-300 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
