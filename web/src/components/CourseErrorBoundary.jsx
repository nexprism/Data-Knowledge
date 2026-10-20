import React from 'react';

class CourseErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('CourseErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="max-w-4xl mx-auto my-6 p-6 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 shadow-sm text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-700 mx-auto">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h4 className="font-semibold text-sm">Section Temporarily Unavailable</h4>
          <p className="text-xs text-amber-800/80 max-w-md mx-auto">
            This module section is being optimized. You can continue browsing the rest of the course.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default CourseErrorBoundary;
