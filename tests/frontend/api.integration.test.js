// Mock DOM elements for testing
const mockElements = {
  loginEmail: { value: 'test@example.com' },
  loginPassword: { value: 'password123' },
  registerUsername: { value: 'testuser' },
  registerEmail: { value: 'test@example.com' },
  registerPassword: { value: 'password123' },
  confirmPassword: { value: 'password123' },
  loginMessage: { textContent: '', className: '' },
  registerMessage: { textContent: '', className: '' }
};

// Mock document.getElementById
global.document = {
  getElementById: jest.fn((id) => mockElements[id]),
  querySelector: jest.fn(() => ({
    disabled: false,
    textContent: 'Login',
    classList: { add: jest.fn(), remove: jest.fn() }
  }))
};

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Import API functions (extracted from script.js)
const API_BASE_URL = 'http://localhost:3000/api';

const showMessage = (element, message, type = 'error') => {
  element.textContent = message;
  element.className = `message ${type}`;
};

const handleLoginSubmit = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(mockElements.loginMessage, 'Login successful!', 'success');
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      return { success: true, data };
    } else {
      showMessage(mockElements.loginMessage, data.message || 'Login failed');
      return { success: false, data };
    }
  } catch (error) {
    showMessage(mockElements.loginMessage, 'Network error. Please try again.');
    return { success: false, error: error.message };
  }
};

const handleRegisterSubmit = async (username, email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(mockElements.registerMessage, 'Registration successful! Please login.', 'success');
      return { success: true, data };
    } else {
      showMessage(mockElements.registerMessage, data.message || 'Registration failed');
      return { success: false, data };
    }
  } catch (error) {
    showMessage(mockElements.registerMessage, 'Network error. Please try again.');
    return { success: false, error: error.message };
  }
};

describe('Frontend API Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    fetch.mockClear();
    if (localStorage.setItem.mockClear) {
      localStorage.setItem.mockClear();
    }
    mockElements.loginMessage.textContent = '';
    mockElements.loginMessage.className = '';
    mockElements.registerMessage.textContent = '';
    mockElements.registerMessage.className = '';
  });

  describe('handleLoginSubmit', () => {
    test('should handle successful login', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          message: 'Login successful',
          token: 'test-token-123',
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com'
          }
        })
      };

      fetch.mockResolvedValue(mockResponse);

      const result = await handleLoginSubmit('test@example.com', 'password123');

      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
      });

      expect(result.success).toBe(true);
      expect(result.data.token).toBe('test-token-123');
      expect(mockElements.loginMessage.textContent).toBe('Login successful!');
      expect(mockElements.loginMessage.className).toBe('message success');
    });

    test('should handle login failure', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          success: false,
          message: 'Invalid credentials'
        })
      };

      fetch.mockResolvedValue(mockResponse);

      const result = await handleLoginSubmit('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.data.message).toBe('Invalid credentials');
      expect(mockElements.loginMessage.textContent).toBe('Invalid credentials');
      expect(mockElements.loginMessage.className).toBe('message error');
    });

    test('should handle network error', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const result = await handleLoginSubmit('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(mockElements.loginMessage.textContent).toBe('Network error. Please try again.');
      expect(mockElements.loginMessage.className).toBe('message error');
    });

    test('should handle login without token', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          message: 'Login successful',
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com'
          }
        })
      };

      fetch.mockResolvedValue(mockResponse);

      const result = await handleLoginSubmit('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data.token).toBeUndefined();
    });
  });

  describe('handleRegisterSubmit', () => {
    test('should handle successful registration', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          message: 'User registered successfully',
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com'
          }
        })
      };

      fetch.mockResolvedValue(mockResponse);

      const result = await handleRegisterSubmit('testuser', 'test@example.com', 'password123');

      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'testuser', email: 'test@example.com', password: 'password123' })
      });

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('User registered successfully');
      expect(mockElements.registerMessage.textContent).toBe('Registration successful! Please login.');
      expect(mockElements.registerMessage.className).toBe('message success');
    });

    test('should handle registration failure - duplicate email', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          success: false,
          message: 'User with this email already exists'
        })
      };

      fetch.mockResolvedValue(mockResponse);

      const result = await handleRegisterSubmit('testuser', 'existing@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.data.message).toBe('User with this email already exists');
      expect(mockElements.registerMessage.textContent).toBe('User with this email already exists');
      expect(mockElements.registerMessage.className).toBe('message error');
    });

    test('should handle registration failure - missing fields', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          success: false,
          message: 'Username, email, and password are required'
        })
      };

      fetch.mockResolvedValue(mockResponse);

      const result = await handleRegisterSubmit('', 'test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.data.message).toBe('Username, email, and password are required');
      expect(mockElements.registerMessage.textContent).toBe('Username, email, and password are required');
      expect(mockElements.registerMessage.className).toBe('message error');
    });

    test('should handle network error during registration', async () => {
      fetch.mockRejectedValue(new Error('Network error'));

      const result = await handleRegisterSubmit('testuser', 'test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(mockElements.registerMessage.textContent).toBe('Network error. Please try again.');
      expect(mockElements.registerMessage.className).toBe('message error');
    });
  });

  describe('showMessage', () => {
    test('should set error message correctly', () => {
      showMessage(mockElements.loginMessage, 'Test error message');
      expect(mockElements.loginMessage.textContent).toBe('Test error message');
      expect(mockElements.loginMessage.className).toBe('message error');
    });

    test('should set success message correctly', () => {
      showMessage(mockElements.registerMessage, 'Success message', 'success');
      expect(mockElements.registerMessage.textContent).toBe('Success message');
      expect(mockElements.registerMessage.className).toBe('message success');
    });

    test('should set custom message type', () => {
      showMessage(mockElements.loginMessage, 'Warning message', 'warning');
      expect(mockElements.loginMessage.textContent).toBe('Warning message');
      expect(mockElements.loginMessage.className).toBe('message warning');
    });
  });

  describe('API Error Handling', () => {
    test('should handle malformed JSON response', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      };

      fetch.mockResolvedValue(mockResponse);

      const result = await handleLoginSubmit('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON');
    });

    test('should handle timeout scenarios', async () => {
      fetch.mockRejectedValue(new Error('Request timeout'));

      const result = await handleLoginSubmit('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout');
      expect(mockElements.loginMessage.textContent).toBe('Network error. Please try again.');
    });
  });
}); 