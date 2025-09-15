import { render, screen, fireEvent } from '../../__tests__/utils/testUtils';
import { ErrorDisplay } from '../ErrorBoundary';

describe('ErrorDisplay Component', () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    mockOnRetry.mockClear();
  });

  it('renders error message correctly', () => {
    const errorMessage = 'This is an error message';
    render(<ErrorDisplay message={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('出现错误')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    const customTitle = 'Custom Error Title';
    const errorMessage = 'Error occurred';
    render(<ErrorDisplay title={customTitle} message={errorMessage} />);
    
    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorDisplay message="Error" onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /重试/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    render(<ErrorDisplay message="Error" onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /重试/i });
    fireEvent.click(retryButton);
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorDisplay message="Error" />);
    
    const retryButton = screen.queryByRole('button', { name: /重试/i });
    expect(retryButton).not.toBeInTheDocument();
  });

  it('does not render retry button when showRetry is false', () => {
    render(<ErrorDisplay message="Error" onRetry={mockOnRetry} showRetry={false} />);
    
    const retryButton = screen.queryByRole('button', { name: /重试/i });
    expect(retryButton).not.toBeInTheDocument();
  });

  it('has correct CSS classes', () => {
    render(<ErrorDisplay message="Error" />);
    
    const errorContainer = screen.getByText('Error').closest('.error-container');
    expect(errorContainer).toBeInTheDocument();
    expect(errorContainer).toHaveClass('error-container');
  });

  it('renders error icon', () => {
    render(<ErrorDisplay message="Error" />);
    
    const errorIcon = screen.getByText('⚠️');
    expect(errorIcon).toBeInTheDocument();
    expect(errorIcon).toHaveClass('error-icon');
  });

  it('renders with long error message', () => {
    const longMessage = 'This is a very long error message that should still be displayed correctly even when it contains multiple sentences and exceeds normal length expectations.';
    render(<ErrorDisplay message={longMessage} />);
    
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('renders empty message correctly', () => {
    render(<ErrorDisplay message="" />);
    
    const errorMessage = screen.getByRole('paragraph');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('error-message');
    expect(errorMessage).toBeEmptyDOMElement();
  });

  it('renders all required elements with proper structure', () => {
    render(<ErrorDisplay message="Test error" onRetry={mockOnRetry} />);
    
    // Check container structure
    const container = screen.getByText('Test error').closest('.error-container');
    expect(container).toBeInTheDocument();
    
    // Check icon
    expect(screen.getByText('⚠️')).toHaveClass('error-icon');
    
    // Check title
    expect(screen.getByText('出现错误')).toHaveClass('error-title');
    
    // Check message
    expect(screen.getByText('Test error')).toHaveClass('error-message');
    
    // Check retry button
    expect(screen.getByText('重试')).toHaveClass('retry-button');
  });
});