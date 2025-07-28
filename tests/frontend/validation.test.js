// Mock DOM elements for testing
const mockElements = {
  loginEmail: { value: '', classList: { add: jest.fn(), remove: jest.fn() } },
  loginPassword: { value: '', classList: { add: jest.fn(), remove: jest.fn() } },
  registerUsername: { value: '', classList: { add: jest.fn(), remove: jest.fn() } },
  registerEmail: { value: '', classList: { add: jest.fn(), remove: jest.fn() } },
  registerPassword: { value: '', classList: { add: jest.fn(), remove: jest.fn() } },
  confirmPassword: { value: '', classList: { add: jest.fn(), remove: jest.fn() } },
  loginMessage: { textContent: '', className: '' },
  registerMessage: { textContent: '', className: '' }
};

// Mock document.getElementById
global.document = {
  getElementById: jest.fn((id) => mockElements[id])
};

// Import validation functions (extracted from script.js)
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const clearInputErrors = () => {
  Object.values(mockElements).forEach(element => {
    if (element.classList && element.classList.remove) {
      element.classList.remove('error');
    }
  });
};

const showMessage = (element, message, type = 'error') => {
  element.textContent = message;
  element.className = `message ${type}`;
};

const validateLoginForm = (email, password) => {
  clearInputErrors();
  let isValid = true;

  if (!email.trim()) {
    mockElements.loginEmail.classList.add('error');
    showMessage(mockElements.loginMessage, 'Email is required');
    isValid = false;
  } else if (!isValidEmail(email)) {
    mockElements.loginEmail.classList.add('error');
    showMessage(mockElements.loginMessage, 'Please enter a valid email address');
    isValid = false;
  }

  if (!password.trim()) {
    mockElements.loginPassword.classList.add('error');
    showMessage(mockElements.loginMessage, 'Password is required');
    isValid = false;
  }

  return isValid;
};

const validateRegisterForm = (username, email, password, confirmPassword) => {
  clearInputErrors();
  let isValid = true;

  if (!username.trim()) {
    mockElements.registerUsername.classList.add('error');
    showMessage(mockElements.registerMessage, 'Username is required');
    isValid = false;
  } else if (username.length < 3) {
    mockElements.registerUsername.classList.add('error');
    showMessage(mockElements.registerMessage, 'Username must be at least 3 characters long');
    isValid = false;
  }

  if (!email.trim()) {
    mockElements.registerEmail.classList.add('error');
    showMessage(mockElements.registerMessage, 'Email is required');
    isValid = false;
  } else if (!isValidEmail(email)) {
    mockElements.registerEmail.classList.add('error');
    showMessage(mockElements.registerMessage, 'Please enter a valid email address');
    isValid = false;
  }

  if (!password.trim()) {
    mockElements.registerPassword.classList.add('error');
    showMessage(mockElements.registerMessage, 'Password is required');
    isValid = false;
  } else if (password.length < 6) {
    mockElements.registerPassword.classList.add('error');
    showMessage(mockElements.registerMessage, 'Password must be at least 6 characters long');
    isValid = false;
  }

  if (!confirmPassword.trim()) {
    mockElements.confirmPassword.classList.add('error');
    showMessage(mockElements.registerMessage, 'Please confirm your password');
    isValid = false;
  } else if (password !== confirmPassword) {
    mockElements.confirmPassword.classList.add('error');
    showMessage(mockElements.registerMessage, 'Passwords do not match');
    isValid = false;
  }

  return isValid;
};

describe('Frontend Validation Functions', () => {
  beforeEach(() => {
    // Reset mock elements
    Object.values(mockElements).forEach(element => {
      if (element.value !== undefined) element.value = '';
      if (element.classList && element.classList.add) element.classList.add.mockClear();
      if (element.classList && element.classList.remove) element.classList.remove.mockClear();
      if (element.textContent !== undefined) element.textContent = '';
      if (element.className !== undefined) element.className = '';
    });
  });

  describe('isValidEmail', () => {
    test('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@example')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('validateLoginForm', () => {
    test('should pass validation with valid data', () => {
      const result = validateLoginForm('test@example.com', 'password123');
      expect(result).toBe(true);
      expect(mockElements.loginMessage.textContent).toBe('');
    });

    test('should fail validation with empty email', () => {
      const result = validateLoginForm('', 'password123');
      expect(result).toBe(false);
      expect(mockElements.loginEmail.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.loginMessage.textContent).toBe('Email is required');
    });

    test('should fail validation with invalid email', () => {
      const result = validateLoginForm('invalid-email', 'password123');
      expect(result).toBe(false);
      expect(mockElements.loginEmail.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.loginMessage.textContent).toBe('Please enter a valid email address');
    });

    test('should fail validation with empty password', () => {
      const result = validateLoginForm('test@example.com', '');
      expect(result).toBe(false);
      expect(mockElements.loginPassword.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.loginMessage.textContent).toBe('Password is required');
    });

    test('should fail validation with whitespace-only values', () => {
      const result = validateLoginForm('   ', '   ');
      expect(result).toBe(false);
      expect(mockElements.loginEmail.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.loginPassword.classList.add).toHaveBeenCalledWith('error');
    });
  });

  describe('validateRegisterForm', () => {
    test('should pass validation with valid data', () => {
      const result = validateRegisterForm('testuser', 'test@example.com', 'password123', 'password123');
      expect(result).toBe(true);
      expect(mockElements.registerMessage.textContent).toBe('');
    });

    test('should fail validation with empty username', () => {
      const result = validateRegisterForm('', 'test@example.com', 'password123', 'password123');
      expect(result).toBe(false);
      expect(mockElements.registerUsername.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.registerMessage.textContent).toBe('Username is required');
    });

    test('should fail validation with short username', () => {
      const result = validateRegisterForm('ab', 'test@example.com', 'password123', 'password123');
      expect(result).toBe(false);
      expect(mockElements.registerUsername.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.registerMessage.textContent).toBe('Username must be at least 3 characters long');
    });

    test('should fail validation with empty email', () => {
      const result = validateRegisterForm('testuser', '', 'password123', 'password123');
      expect(result).toBe(false);
      expect(mockElements.registerEmail.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.registerMessage.textContent).toBe('Email is required');
    });

    test('should fail validation with invalid email', () => {
      const result = validateRegisterForm('testuser', 'invalid-email', 'password123', 'password123');
      expect(result).toBe(false);
      expect(mockElements.registerEmail.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.registerMessage.textContent).toBe('Please enter a valid email address');
    });

    test('should fail validation with empty password', () => {
      const result = validateRegisterForm('testuser', 'test@example.com', '', '');
      expect(result).toBe(false);
      expect(mockElements.confirmPassword.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.registerMessage.textContent).toBe('Please confirm your password');
    });

    test('should fail validation with short password', () => {
      const result = validateRegisterForm('testuser', 'test@example.com', '123', '123');
      expect(result).toBe(false);
      expect(mockElements.registerPassword.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.registerMessage.textContent).toBe('Password must be at least 6 characters long');
    });

    test('should fail validation with empty confirm password', () => {
      const result = validateRegisterForm('testuser', 'test@example.com', 'password123', '');
      expect(result).toBe(false);
      expect(mockElements.confirmPassword.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.registerMessage.textContent).toBe('Please confirm your password');
    });

    test('should fail validation with mismatched passwords', () => {
      const result = validateRegisterForm('testuser', 'test@example.com', 'password123', 'different123');
      expect(result).toBe(false);
      expect(mockElements.confirmPassword.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.registerMessage.textContent).toBe('Passwords do not match');
    });
  });

  describe('clearInputErrors', () => {
    test('should remove error class from all inputs', () => {
      // Add error classes first
      mockElements.loginEmail.classList.add('error');
      mockElements.registerPassword.classList.add('error');
      
      clearInputErrors();
      
      expect(mockElements.loginEmail.classList.remove).toHaveBeenCalledWith('error');
      expect(mockElements.registerPassword.classList.remove).toHaveBeenCalledWith('error');
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
  });
}); 