import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Mock API responses
export const mockApiResponses = {
  auth: {
    login: {
      success: {
        data: {
          token: 'mock-token',
          user: {
            hospital_name: 'Test Hospital',
            product_batch: 'TEST001',
            conversation_id: 'conv-123'
          }
        }
      },
      error: {
        response: {
          status: 401,
          data: { message: '登录失败' }
        }
      }
    },
    getCurrentUser: {
      success: {
        data: {
          hospital_name: 'Test Hospital',
          product_batch: 'TEST001',
          conversation_id: 'conv-123'
        }
      }
    }
  },
  chat: {
    sendMessage: {
      success: {
        data: {
          reply: 'This is a test response',
          conversation_id: 'conv-123'
        }
      }
    }
  },
  admin: {
    getPairs: {
      success: {
        data: [
          {
            id: 1,
            hospital_name: 'Test Hospital 1',
            product_batch: 'TEST001',
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            hospital_name: 'Test Hospital 2',
            product_batch: 'TEST002',
            created_at: '2024-01-02T00:00:00Z'
          }
        ],
        total: 2
      }
    }
  }
};

// Mock API functions
export const mockApi = {
  authApi: {
    login: jest.fn(),
    getCurrentUser: jest.fn(),
    logout: jest.fn(),
    adminLogin: jest.fn(),
    adminLogout: jest.fn()
  },
  chatApi: {
    sendMessage: jest.fn()
  },
  adminApi: {
    getPairs: jest.fn(),
    createPair: jest.fn(),
    updatePair: jest.fn(),
    deletePair: jest.fn(),
    importCSV: jest.fn(),
    exportCSV: jest.fn()
  }
};

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
      <ToastContainer />
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Helper functions for testing
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    })
  };
};

// Mock react-router-dom hooks
export const mockNavigate = jest.fn();
export const mockUseNavigate = () => mockNavigate;

// Mock toast notifications
export const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn()
};