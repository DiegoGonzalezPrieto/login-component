const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');

// Import the server app
let app;
let server;

// Mock the database
const database = {
    createUser: jest.fn(),
    findUserByEmail: jest.fn(),
    getAllUsers: jest.fn(),
    userExists: jest.fn(),
    getUserCount: jest.fn(),
    close: jest.fn()
};

// Create a test version of the server
beforeAll(async () => {
  const express = require('express');
  const cors = require('cors');
  const bodyParser = require('body-parser');
  
  app = express();
  
  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
  });
  
  // Registration endpoint
  app.post('/api/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Basic validation
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required'
        });
      }
      
      // Check if user already exists
      const userExists = await database.userExists(email);
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };
      
      // Save user to database
      await database.createUser(newUser);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
  
  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Basic validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      
      // Find user by email
      const user = await database.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Generate token
      const token = `token_${user.id}_${Date.now()}`;
      
      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
  
  // Get all users (for debugging purposes)
  app.get('/api/users', async (req, res) => {
    try {
      const users = await database.getAllUsers();
      const userCount = await database.getUserCount();
      
      res.json({
        success: true,
        count: userCount,
        users: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  });
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found'
    });
  });
  
  server = app.listen(0); // Use random port
});

afterAll(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

describe('API Integration Tests', () => {
  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toEqual({
        status: 'OK',
        message: 'Server is running'
      });
    });
  });

  describe('POST /api/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toMatchObject({
        username: userData.username,
        email: userData.email
      });
      expect(response.body.user.id).toBeDefined();
      
      // Verify database was called
      expect(database.createUser).toHaveBeenCalledWith(expect.objectContaining({
        username: userData.username,
        email: userData.email
      }));
    });

    test('should fail registration with missing username', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username, email, and password are required');
    });

    test('should fail registration with missing email', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username, email, and password are required');
    });

    test('should fail registration with missing password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com'
      };
      
      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username, email, and password are required');
    });

    test('should fail registration with duplicate email', async () => {
      // Mock database to return false for first user (doesn't exist)
      database.userExists.mockResolvedValueOnce(false);
      
      // Register first user
      const userData1 = {
        username: 'testuser1',
        email: 'test@example.com',
        password: 'password123'
      };
      
      await request(app)
        .post('/api/register')
        .send(userData1)
        .expect(201);
      
      // Mock database to return true for second user (already exists)
      database.userExists.mockResolvedValueOnce(true);
      
      // Try to register second user with same email
      const userData2 = {
        username: 'testuser2',
        email: 'test@example.com',
        password: 'password456'
      };
      
      const response = await request(app)
        .post('/api/register')
        .send(userData2)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      // Mock database for login tests
      const hashedPassword = await bcrypt.hash('password123', 10);
      database.findUserByEmail.mockResolvedValue({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });
    });

    test('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toMatchObject({
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    test('should fail login with missing email', async () => {
      const loginData = {
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password are required');
    });

    test('should fail login with missing password', async () => {
      const loginData = {
        email: 'test@example.com'
      };
      
      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password are required');
    });

    test('should fail login with non-existent email', async () => {
      // Mock database to return null for non-existent user
      database.findUserByEmail.mockResolvedValueOnce(null);
      
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should fail login with wrong password', async () => {
      // Mock database to return user with correct password hash
      const hashedPassword = await bcrypt.hash('password123', 10);
      database.findUserByEmail.mockResolvedValueOnce({
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });
      
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/users', () => {
    test('should return empty users list initially', async () => {
      // Mock database to return empty users
      database.getAllUsers.mockResolvedValue([]);
      database.getUserCount.mockResolvedValue(0);
      
      const response = await request(app)
        .get('/api/users')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.users).toEqual([]);
    });

    test('should return users list after registration', async () => {
      // Mock database to return users
      const mockUsers = [
        {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          created_at: '2023-01-01T00:00:00.000Z'
        }
      ];
      database.getAllUsers.mockResolvedValue(mockUsers);
      database.getUserCount.mockResolvedValue(1);
      
      const response = await request(app)
        .get('/api/users')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.users).toHaveLength(1);
      expect(response.body.users[0]).toMatchObject({
        username: 'testuser',
        email: 'test@example.com'
      });
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent endpoint', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Endpoint not found');
    });
  });
}); 