const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');

// Create a test server instance
let app;
let server;
const database = {
    createUser: jest.fn(),
    findUserByEmail: jest.fn(),
    getAllUsers: jest.fn(),
    userExists: jest.fn(),
    getUserCount: jest.fn(),
    close: jest.fn()
};

beforeAll(async () => {
  const express = require('express');
  const cors = require('cors');
  const bodyParser = require('body-parser');
  
  app = express();
  
  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  
  // Registration endpoint
  app.post('/api/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required'
        });
      }
      
      const userExists = await database.userExists(email);
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };
      
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
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      
      const user = await database.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
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
  
  server = app.listen(0);
});

afterAll(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Complete User Flow Tests', () => {
  describe('User Registration and Login Flow', () => {
    test('should complete full registration and login flow', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock database for registration
      database.userExists.mockResolvedValue(false);
      
      // Step 1: Register user
      const registerResponse = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.message).toBe('User registered successfully');
      expect(registerResponse.body.user).toMatchObject({
        username: userData.username,
        email: userData.email
      });

      // Verify database was called
      expect(database.createUser).toHaveBeenCalledWith(expect.objectContaining({
        username: userData.username,
        email: userData.email
      }));

      // Mock database for login
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      database.findUserByEmail.mockResolvedValue({
        id: '1',
        username: userData.username,
        email: userData.email,
        password: hashedPassword
      });
      
      // Step 2: Login with registered user
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.message).toBe('Login successful');
      expect(loginResponse.body.token).toBeDefined();
      expect(loginResponse.body.user).toMatchObject({
        username: userData.username,
        email: userData.email
      });
    });

    test('should handle registration followed by failed login', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Step 1: Register user
      await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      // Step 2: Try to login with wrong password
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(loginResponse.body.success).toBe(false);
      expect(loginResponse.body.message).toBe('Invalid credentials');
    });

    test('should handle multiple user registrations', async () => {
      const user1 = {
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123'
      };

      const user2 = {
        username: 'user2',
        email: 'user2@example.com',
        password: 'password456'
      };

      // Mock database for first user registration
      database.userExists.mockResolvedValueOnce(false);
      
      // Register first user
      await request(app)
        .post('/api/register')
        .send(user1)
        .expect(201);

      // Mock database for second user registration
      database.userExists.mockResolvedValueOnce(false);
      
      // Register second user
      await request(app)
        .post('/api/register')
        .send(user2)
        .expect(201);

      // Mock database for login attempts
      const hashedPassword1 = await bcrypt.hash(user1.password, 10);
      const hashedPassword2 = await bcrypt.hash(user2.password, 10);
      
      database.findUserByEmail
        .mockResolvedValueOnce({
          id: '1',
          username: user1.username,
          email: user1.email,
          password: hashedPassword1
        })
        .mockResolvedValueOnce({
          id: '2',
          username: user2.username,
          email: user2.email,
          password: hashedPassword2
        });

      // Verify both users can login
      const login1Response = await request(app)
        .post('/api/login')
        .send({
          email: user1.email,
          password: user1.password
        })
        .expect(200);

      const login2Response = await request(app)
        .post('/api/login')
        .send({
          email: user2.email,
          password: user2.password
        })
        .expect(200);

      expect(login1Response.body.success).toBe(true);
      expect(login2Response.body.success).toBe(true);
      expect(database.createUser).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Scenarios in Complete Flow', () => {
    test('should handle duplicate registration attempts', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock database for first registration (user doesn't exist)
      database.userExists.mockResolvedValueOnce(false);
      
      // First registration
      await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      // Mock database for duplicate registration (user already exists)
      database.userExists.mockResolvedValueOnce(true);
      
      // Duplicate registration attempt
      const duplicateResponse = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(400);

      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.message).toBe('User with this email already exists');
    });

    test('should handle login with non-existent user', async () => {
      // Mock database to return null for non-existent user
      database.findUserByEmail.mockResolvedValueOnce(null);
      
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(loginResponse.body.success).toBe(false);
      expect(loginResponse.body.message).toBe('Invalid credentials');
    });

    test('should handle registration with invalid data', async () => {
      // Missing username
      const response1 = await request(app)
        .post('/api/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response1.body.message).toBe('Username, email, and password are required');

      // Missing email
      const response2 = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(400);

      expect(response2.body.message).toBe('Username, email, and password are required');

      // Missing password
      const response3 = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com'
        })
        .expect(400);

      expect(response3.body.message).toBe('Username, email, and password are required');
    });

    test('should handle login with invalid data', async () => {
      // Missing email
      const response1 = await request(app)
        .post('/api/login')
        .send({
          password: 'password123'
        })
        .expect(400);

      expect(response1.body.message).toBe('Email and password are required');

      // Missing password
      const response2 = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      expect(response2.body.message).toBe('Email and password are required');
    });
  });

  describe('Security and Data Integrity', () => {
    test('should hash passwords correctly and not store plain text', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock database for registration
      database.userExists.mockResolvedValue(false);
      
      // Register user
      await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      // Verify password is hashed by checking the database call
      expect(database.createUser).toHaveBeenCalledWith(expect.objectContaining({
        username: userData.username,
        email: userData.email,
        password: expect.not.stringMatching(userData.password) // Password should be hashed
      }));
      
      // Verify the hashed password is long enough (bcrypt hash)
      const createUserCall = database.createUser.mock.calls[0][0];
      expect(createUserCall.password.length).toBeGreaterThan(20);
    });

    test('should generate different tokens for different logins', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock database for registration
      database.userExists.mockResolvedValue(false);
      
      // Register user
      await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      // Mock database for login attempts
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      database.findUserByEmail
        .mockResolvedValueOnce({
          id: '1',
          username: userData.username,
          email: userData.email,
          password: hashedPassword
        })
        .mockResolvedValueOnce({
          id: '1',
          username: userData.username,
          email: userData.email,
          password: hashedPassword
        });

      // Login twice
      const login1Response = await request(app)
        .post('/api/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const login2Response = await request(app)
        .post('/api/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      // Tokens should be different
      expect(login1Response.body.token).not.toBe(login2Response.body.token);
    });

    test('should not expose sensitive data in responses', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock database for registration
      database.userExists.mockResolvedValue(false);
      
      // Register user
      const registerResponse = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      // Verify password is not in response
      expect(registerResponse.body.user.password).toBeUndefined();
      expect(registerResponse.body.user).toMatchObject({
        username: userData.username,
        email: userData.email
      });

      // Login
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      // Verify password is not in response
      expect(loginResponse.body.user.password).toBeUndefined();
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent registrations', async () => {
      const user1 = {
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123'
      };

      const user2 = {
        username: 'user2',
        email: 'user2@example.com',
        password: 'password456'
      };

      // Mock database for concurrent registrations
      database.userExists.mockResolvedValue(false);
      
      // Register both users concurrently
      const [response1, response2] = await Promise.all([
        request(app).post('/api/register').send(user1),
        request(app).post('/api/register').send(user2)
      ]);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(database.createUser).toHaveBeenCalledTimes(2);
    });

    test('should handle concurrent logins', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock database for registration
      database.userExists.mockResolvedValue(false);
      
      // Register user
      await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      // Mock database for concurrent logins
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      database.findUserByEmail
        .mockResolvedValueOnce({
          id: '1',
          username: userData.username,
          email: userData.email,
          password: hashedPassword
        })
        .mockResolvedValueOnce({
          id: '1',
          username: userData.username,
          email: userData.email,
          password: hashedPassword
        });

      // Login twice concurrently
      const [login1, login2] = await Promise.all([
        request(app).post('/api/login').send({
          email: userData.email,
          password: userData.password
        }),
        request(app).post('/api/login').send({
          email: userData.email,
          password: userData.password
        })
      ]);

      expect(login1.status).toBe(200);
      expect(login2.status).toBe(200);
      expect(login1.body.success).toBe(true);
      expect(login2.body.success).toBe(true);
    });
  });
}); 