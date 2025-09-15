import { renderHook, act } from '@testing-library/react';
import useErrorHandler from '../useErrorHandler';

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn()
  }
}));

describe('useErrorHandler Hook', () => {
  it('initializes with no error', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    expect(result.current.isError).toBe(false);
    expect(result.current.errorMessage).toBe('');
  });

  it('handles string errors correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.setError('Test error message');
    });
    
    expect(result.current.isError).toBe(true);
    expect(result.current.errorMessage).toBe('Test error message');
  });

  it('handles Error objects correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Test error object');
    
    act(() => {
      result.current.setError(error);
    });
    
    expect(result.current.isError).toBe(true);
    expect(result.current.errorMessage).toBe('Test error object');
  });

  it('handles axios errors correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    const axiosError = new Error('Request failed');
    (axiosError as any).response = {
      data: {
        message: 'Server error message'
      },
      status: 500
    };
    
    act(() => {
      result.current.setError(axiosError);
    });
    
    expect(result.current.isError).toBe(true);
    expect(result.current.errorMessage).toBe('Server error message');
  });

  it('handles axios errors without message correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    const axiosError = new Error('Request failed');
    (axiosError as any).response = {
      status: 400,
      data: {}
    };
    
    act(() => {
      result.current.setError(axiosError);
    });
    
    expect(result.current.isError).toBe(true);
    expect(result.current.errorMessage).toBe('Request failed');
  });

  it('handles network errors correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    const networkError = new Error('Network Error');
    (networkError as any).code = 'NETWORK_ERROR';
    
    act(() => {
      result.current.setError(networkError);
    });
    
    expect(result.current.isError).toBe(true);
    expect(result.current.errorMessage).toBe('网络连接失败，请检查网络设置');
  });

  it('handles unknown errors correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    act(() => {
      result.current.setError(new Error());
    });
    
    expect(result.current.isError).toBe(true);
    expect(result.current.errorMessage).toBe('发生了未知错误，请重试');
  });

  it('clears error correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    
    // Set an error first
    act(() => {
      result.current.setError('Test error');
    });
    
    expect(result.current.isError).toBe(true);
    
    // Clear the error
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.errorMessage).toBe('');
  });

  it('handleAsyncError works with successful promises', async () => {
    const { result } = renderHook(() => useErrorHandler());
    
    await act(async () => {
      const result_value = await result.current.handleAsyncError(() => Promise.resolve('success'));
      expect(result_value).toBe('success');
    });
    
    expect(result.current.isError).toBe(false);
  });

  it('handleAsyncError works with rejected promises', async () => {
    const { result } = renderHook(() => useErrorHandler());
    
    await act(async () => {
      const result_value = await result.current.handleAsyncError(() => Promise.reject(new Error('Async error')));
      expect(result_value).toBe(null);
    });
    
    expect(result.current.isError).toBe(true);
    expect(result.current.errorMessage).toBe('Async error');
  });

  it('handleAsyncError works with async functions', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const asyncFunction = async () => {
      throw new Error('Async function error');
    };
    
    await act(async () => {
      const result_value = await result.current.handleAsyncError(asyncFunction);
      expect(result_value).toBe(null);
    });
    
    expect(result.current.isError).toBe(true);
    expect(result.current.errorMessage).toBe('Async function error');
  });

  it('withErrorHandling wraps functions correctly', async () => {
    const { result } = renderHook(() => useErrorHandler());
    
    const mockFn = jest.fn().mockResolvedValue('success');
    const wrappedFn = result.current.withErrorHandling(mockFn);
    
    await act(async () => {
      const resultValue = await wrappedFn();
      expect(resultValue).toBe('success');
    });
    
    expect(mockFn).toHaveBeenCalled();
    expect(result.current.isError).toBe(false);
  });

  it('withErrorHandling handles errors correctly', async () => {
    const { result } = renderHook(() => useErrorHandler());
    
    const mockFn = jest.fn().mockRejectedValue(new Error('Function error'));
    const wrappedFn = result.current.withErrorHandling(mockFn);
    
    await act(async () => {
      const resultValue = await wrappedFn();
      expect(resultValue).toBeNull();
    });
    
    expect(mockFn).toHaveBeenCalled();
    expect(result.current.isError).toBe(true);
    expect(result.current.errorMessage).toBe('Function error');
  });
});