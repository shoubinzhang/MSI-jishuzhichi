import { render, screen } from '../../__tests__/utils/testUtils';
import Loading from '../Loading';

describe('Loading Component', () => {
  it('renders with default props', () => {
    render(<Loading />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    const customText = 'Custom loading text';
    render(<Loading text={customText} />);
    
    expect(screen.getByText(customText)).toBeInTheDocument();
  });

  it('renders with small size', () => {
    render(<Loading size="small" />);
    
    const loadingContainer = screen.getByRole('status');
    expect(loadingContainer).toHaveClass('loading-container');
    
    const spinner = loadingContainer.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('small');
  });

  it('renders with large size', () => {
    render(<Loading size="large" />);
    
    const loadingContainer = screen.getByRole('status');
    const spinner = loadingContainer.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('large');
  });

  it('renders with overlay', () => {
    render(<Loading overlay />);
    
    const overlay = screen.getByRole('status');
    expect(overlay).toHaveClass('loading-overlay');
  });

  it('renders without overlay by default', () => {
    render(<Loading />);
    
    const container = screen.getByRole('status');
    expect(container).not.toHaveClass('loading-overlay');
    expect(container).toHaveClass('loading-container');
  });

  it('combines size and overlay props correctly', () => {
    render(<Loading size="small" overlay text="Loading with overlay" />);
    
    const overlay = screen.getByRole('status');
    expect(overlay).toHaveClass('loading-overlay');
    
    const spinner = overlay.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('small');
    
    expect(screen.getByText('Loading with overlay')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<Loading text="Loading data" />);
    
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toHaveAttribute('aria-label', 'Loading data');
  });
});