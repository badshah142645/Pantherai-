import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Here you could send the error to a logging service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReportError = () => {
    // Here you could open a support ticket or send error details
    const errorDetails = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('Error report:', errorDetails);
    alert('Error details have been logged. Please contact support if the problem persists.');
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h1 className="error-title">Something went wrong</h1>
            <p className="error-message">
              We're sorry, but something unexpected happened. This error has been logged and our team has been notified.
            </p>

            <div className="error-actions">
              <button
                className="btn-primary"
                onClick={this.handleRetry}
              >
                Try Again
              </button>
              <button
                className="btn-secondary"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
              <button
                className="btn-secondary"
                onClick={this.handleReportError}
              >
                Report Error
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-stack">
                  <h3>Error:</h3>
                  <pre>{this.state.error?.message}</pre>

                  <h3>Stack Trace:</h3>
                  <pre>{this.state.error?.stack}</pre>

                  <h3>Component Stack:</h3>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                </div>
              </details>
            )}

            <div className="error-support">
              <p>
                If this problem persists, please contact our support team at{' '}
                <a href="mailto:support@zhenbahhub.com">support@zhenbahhub.com</a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;