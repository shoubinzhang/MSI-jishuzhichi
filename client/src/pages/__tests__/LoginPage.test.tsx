import { render, screen } from '../../__tests__/utils/testUtils';
import LoginPage from '../LoginPage';

// Mock the API module
jest.mock('../../api', () => ({
  authApi: {
    login: jest.fn()
  }
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  },
  ToastContainer: () => null
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('医院登录系统')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
    expect(screen.getByText('管理员登录')).toBeInTheDocument();
  });
});