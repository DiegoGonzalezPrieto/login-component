const bcrypt = require('bcrypt');

// Mock the users array for testing
const users = [];

// Import validation functions from server
const validateRegistration = (username, email, password) => {
  if (!username || !email || !password) {
    return { isValid: false, message: 'Username, email, and password are required' };
  }
  
  if (username.length < 3) {
    return { isValid: false, message: 'Username must be at least 3 characters long' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return { isValid: false, message: 'User with this email already exists' };
  }
  
  return { isValid: true, message: 'Validation passed' };
};

const validateLogin = (email, password) => {
  if (!email || !password) {
    return { isValid: false, message: 'Email and password are required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true, message: 'Validation passed' };
};

describe('Backend Validation Functions', () => {
  beforeEach(() => {
    users.length = 0; // Clear users array before each test
  });

  describe('validateRegistration', () => {
    test('should pass validation with valid data', () => {
      const result = validateRegistration('testuser', 'test@example.com', 'password123');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Validation passed');
    });

    test('should fail validation with missing username', () => {
      const result = validateRegistration('', 'test@example.com', 'password123');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Username, email, and password are required');
    });

    test('should fail validation with missing email', () => {
      const result = validateRegistration('testuser', '', 'password123');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Username, email, and password are required');
    });

    test('should fail validation with missing password', () => {
      const result = validateRegistration('testuser', 'test@example.com', '');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Username, email, and password are required');
    });

    test('should fail validation with short username', () => {
      const result = validateRegistration('ab', 'test@example.com', 'password123');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Username must be at least 3 characters long');
    });

    test('should fail validation with short password', () => {
      const result = validateRegistration('testuser', 'test@example.com', '123');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password must be at least 6 characters long');
    });

    test('should fail validation with invalid email', () => {
      const result = validateRegistration('testuser', 'invalid-email', 'password123');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Please enter a valid email address');
    });

    test('should fail validation with duplicate email', () => {
      // Add a user first
      users.push({ email: 'test@example.com' });
      
      const result = validateRegistration('testuser', 'test@example.com', 'password123');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('User with this email already exists');
    });
  });

  describe('validateLogin', () => {
    test('should pass validation with valid data', () => {
      const result = validateLogin('test@example.com', 'password123');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Validation passed');
    });

    test('should fail validation with missing email', () => {
      const result = validateLogin('', 'password123');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Email and password are required');
    });

    test('should fail validation with missing password', () => {
      const result = validateLogin('test@example.com', '');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Email and password are required');
    });

    test('should fail validation with invalid email', () => {
      const result = validateLogin('invalid-email', 'password123');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Please enter a valid email address');
    });
  });
});

describe('Password Hashing', () => {
  test('should hash password correctly', async () => {
    const password = 'testpassword123';
    const saltRounds = 10;
    
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword.length).toBeGreaterThan(20);
  });

  test('should verify password correctly', async () => {
    const password = 'testpassword123';
    const saltRounds = 10;
    
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const isValid = await bcrypt.compare(password, hashedPassword);
    
    expect(isValid).toBe(true);
  });

  test('should reject incorrect password', async () => {
    const password = 'testpassword123';
    const wrongPassword = 'wrongpassword';
    const saltRounds = 10;
    
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
    
    expect(isValid).toBe(false);
  });

  test('should generate different hashes for same password', async () => {
    const password = 'testpassword123';
    const saltRounds = 10;
    
    const hash1 = await bcrypt.hash(password, saltRounds);
    const hash2 = await bcrypt.hash(password, saltRounds);
    
    expect(hash1).not.toBe(hash2);
  });
}); 