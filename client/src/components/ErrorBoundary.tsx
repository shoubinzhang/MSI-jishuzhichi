import * as React from 'react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = '出现错误',
  message,
  onRetry,
  showRetry = true
}) => {
  return (
    <div className='error-container'>
      <div className='error-icon'>⚠️</div>
      <h3 className='error-title'>{title}</h3>
      <p className='error-message'>{message}</p>
      {showRetry && onRetry && (
        <div className='error-actions'>
          <button className='retry-button' onClick={onRetry}>
            重试
          </button>
        </div>
      )}
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          title='应用程序错误'
          message={this.state.error?.message || '发生了未知错误，请重试'}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export { ErrorDisplay, ErrorBoundary };
export default ErrorBoundary;
