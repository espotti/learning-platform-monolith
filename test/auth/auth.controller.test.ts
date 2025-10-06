import { authController } from '../../src/controllers/auth.controller';
import { AuthService } from '../../src/services/auth.service';
import { db, mockDbQuery, resetDbMock } from '../__mocks__/db';
import { createMockRequest, createMockResponse } from '../setup';

jest.mock('../../src/db', () => require('../__mocks__/db'));

jest.mock('../../src/services/auth.service', () => ({
  AuthService: {
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
    generateToken: jest.fn(),
    verifyToken: jest.fn(),
    createUserProfile: jest.fn()
  }
}));

jest.mock('../../src/config', () => ({
  config: {
    jwtSecret: 'test-jwt-secret',
    version: 'v1.0-test',
    port: 4001,
    nodeEnv: 'test',
    databaseUrl: 'postgresql://test:test@localhost:5432/test_db',
    logLevel: 'error',
    appName: 'learnlite-test',
    notificationsEnabled: false,
    notificationsSink: 'console'
  }
}));

describe('Auth Controller', () => {
  beforeEach(() => {
    resetDbMock();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    it('should successfully register a new user with default role', async () => {
      const req = createMockRequest({ body: validUserData });
      const res = createMockResponse();

      mockDbQuery([]);
      mockDbQuery([{ 
        id: 1, 
        email: 'test@example.com', 
        name: 'Test User', 
        role: 'student', 
        created_at: new Date() 
      }]);

      (AuthService.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (AuthService.generateToken as jest.Mock).mockReturnValue('mock_jwt_token');
      (AuthService.createUserProfile as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        createdAt: new Date()
      });

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        message: 'User registered successfully',
        token: 'mock_jwt_token',
        user: expect.any(Object),
        version: 'v1.0-test'
      });
      expect(AuthService.hashPassword).toHaveBeenCalledWith('password123');
    });

    it('should successfully register a user with explicit admin role', async () => {
      const req = createMockRequest({ 
        body: { ...validUserData, role: 'admin' } 
      });
      const res = createMockResponse();

      mockDbQuery([]);
      mockDbQuery([{ 
        id: 1, 
        email: 'test@example.com', 
        name: 'Test User', 
        role: 'admin', 
        created_at: new Date() 
      }]);

      (AuthService.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (AuthService.generateToken as jest.Mock).mockReturnValue('mock_jwt_token');
      (AuthService.createUserProfile as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        createdAt: new Date()
      });

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
        ['test@example.com', 'hashed_password', 'Test User', 'admin']
      );
    });

    it('should successfully register a user with explicit instructor role', async () => {
      const req = createMockRequest({ 
        body: { ...validUserData, role: 'instructor' } 
      });
      const res = createMockResponse();

      mockDbQuery([]);
      mockDbQuery([{ 
        id: 1, 
        email: 'test@example.com', 
        name: 'Test User', 
        role: 'instructor', 
        created_at: new Date() 
      }]);

      (AuthService.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (AuthService.generateToken as jest.Mock).mockReturnValue('mock_jwt_token');
      (AuthService.createUserProfile as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'instructor',
        createdAt: new Date()
      });

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should successfully register a user with explicit student role', async () => {
      const req = createMockRequest({ 
        body: { ...validUserData, role: 'student' } 
      });
      const res = createMockResponse();

      mockDbQuery([]);
      mockDbQuery([{ 
        id: 1, 
        email: 'test@example.com', 
        name: 'Test User', 
        role: 'student', 
        created_at: new Date() 
      }]);

      (AuthService.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (AuthService.generateToken as jest.Mock).mockReturnValue('mock_jwt_token');
      (AuthService.createUserProfile as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        createdAt: new Date()
      });

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 when email is missing', async () => {
      const req = createMockRequest({ 
        body: { password: 'password123', name: 'Test User' } 
      });
      const res = createMockResponse();

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email, password, and name are required',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 when password is missing', async () => {
      const req = createMockRequest({ 
        body: { email: 'test@example.com', name: 'Test User' } 
      });
      const res = createMockResponse();

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email, password, and name are required',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 when name is missing', async () => {
      const req = createMockRequest({ 
        body: { email: 'test@example.com', password: 'password123' } 
      });
      const res = createMockResponse();

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email, password, and name are required',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 when email format is invalid', async () => {
      const req = createMockRequest({ 
        body: { ...validUserData, email: 'notanemail' } 
      });
      const res = createMockResponse();

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 when email is missing @ symbol', async () => {
      const req = createMockRequest({ 
        body: { ...validUserData, email: 'testexample.com' } 
      });
      const res = createMockResponse();

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 when email is missing domain', async () => {
      const req = createMockRequest({ 
        body: { ...validUserData, email: 'test@' } 
      });
      const res = createMockResponse();

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 when password is too short', async () => {
      const req = createMockRequest({ 
        body: { ...validUserData, password: 'pass' } 
      });
      const res = createMockResponse();

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 6 characters long',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 when password is exactly 5 characters', async () => {
      const req = createMockRequest({ 
        body: { ...validUserData, password: '12345' } 
      });
      const res = createMockResponse();

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should accept password that is exactly 6 characters', async () => {
      const req = createMockRequest({ 
        body: { ...validUserData, password: '123456' } 
      });
      const res = createMockResponse();

      mockDbQuery([]);
      mockDbQuery([{ 
        id: 1, 
        email: 'test@example.com', 
        name: 'Test User', 
        role: 'student', 
        created_at: new Date() 
      }]);

      (AuthService.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (AuthService.generateToken as jest.Mock).mockReturnValue('mock_jwt_token');
      (AuthService.createUserProfile as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        createdAt: new Date()
      });

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 when role is invalid', async () => {
      const req = createMockRequest({ 
        body: { ...validUserData, role: 'superadmin' } 
      });
      const res = createMockResponse();

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid role. Must be admin, instructor, or student',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 409 when email already exists', async () => {
      const req = createMockRequest({ body: validUserData });
      const res = createMockResponse();

      mockDbQuery([{ id: 1 }]);

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should convert email to lowercase when checking for existing user', async () => {
      const req = createMockRequest({ 
        body: { ...validUserData, email: 'Test@Example.COM' } 
      });
      const res = createMockResponse();

      mockDbQuery([]);
      mockDbQuery([{ 
        id: 1, 
        email: 'test@example.com', 
        name: 'Test User', 
        role: 'student', 
        created_at: new Date() 
      }]);

      (AuthService.hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (AuthService.generateToken as jest.Mock).mockReturnValue('mock_jwt_token');
      (AuthService.createUserProfile as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        createdAt: new Date()
      });

      await authController.register(req as any, res as any);

      expect(db.query).toHaveBeenNthCalledWith(1, 
        'SELECT id FROM users WHERE email = $1',
        ['test@example.com']
      );
    });

    it('should return 500 when database query fails during email check', async () => {
      const req = createMockRequest({ body: validUserData });
      const res = createMockResponse();

      mockDbQuery([], new Error('Database connection error'));

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Registration failed',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 500 when database query fails during user creation', async () => {
      const req = createMockRequest({ body: validUserData });
      const res = createMockResponse();

      mockDbQuery([]);
      mockDbQuery([], new Error('Insert failed'));

      (AuthService.hashPassword as jest.Mock).mockResolvedValue('hashed_password');

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Registration failed',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 500 when password hashing fails', async () => {
      const req = createMockRequest({ body: validUserData });
      const res = createMockResponse();

      mockDbQuery([]);

      (AuthService.hashPassword as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await authController.register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should successfully login with valid credentials', async () => {
      const req = createMockRequest({ body: validCredentials });
      const res = createMockResponse();

      mockDbQuery([{ 
        id: 1, 
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User', 
        role: 'student',
        created_at: new Date()
      }]);

      (AuthService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (AuthService.generateToken as jest.Mock).mockReturnValue('mock_jwt_token');
      (AuthService.createUserProfile as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        createdAt: new Date()
      });

      await authController.login(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        message: 'Login successful',
        token: 'mock_jwt_token',
        user: expect.any(Object),
        version: 'v1.0-test'
      });
      expect(AuthService.verifyPassword).toHaveBeenCalledWith('password123', 'hashed_password');
    });

    it('should return 400 when email is missing', async () => {
      const req = createMockRequest({ 
        body: { password: 'password123' } 
      });
      const res = createMockResponse();

      await authController.login(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 400 when password is missing', async () => {
      const req = createMockRequest({ 
        body: { email: 'test@example.com' } 
      });
      const res = createMockResponse();

      await authController.login(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 401 when user does not exist', async () => {
      const req = createMockRequest({ body: validCredentials });
      const res = createMockResponse();

      mockDbQuery([]);

      await authController.login(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 401 when password is incorrect', async () => {
      const req = createMockRequest({ body: validCredentials });
      const res = createMockResponse();

      mockDbQuery([{ 
        id: 1, 
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User', 
        role: 'student',
        created_at: new Date()
      }]);

      (AuthService.verifyPassword as jest.Mock).mockResolvedValue(false);

      await authController.login(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should convert email to lowercase when finding user', async () => {
      const req = createMockRequest({ 
        body: { email: 'Test@Example.COM', password: 'password123' } 
      });
      const res = createMockResponse();

      mockDbQuery([{ 
        id: 1, 
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User', 
        role: 'student',
        created_at: new Date()
      }]);

      (AuthService.verifyPassword as jest.Mock).mockResolvedValue(true);
      (AuthService.generateToken as jest.Mock).mockReturnValue('mock_jwt_token');
      (AuthService.createUserProfile as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        createdAt: new Date()
      });

      await authController.login(req as any, res as any);

      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, email, password_hash, name, role, created_at FROM users WHERE email = $1',
        ['test@example.com']
      );
    });

    it('should return 500 when database query fails', async () => {
      const req = createMockRequest({ body: validCredentials });
      const res = createMockResponse();

      mockDbQuery([], new Error('Database error'));

      await authController.login(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Login failed',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 500 when password verification fails with error', async () => {
      const req = createMockRequest({ body: validCredentials });
      const res = createMockResponse();

      mockDbQuery([{ 
        id: 1, 
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User', 
        role: 'student',
        created_at: new Date()
      }]);

      (AuthService.verifyPassword as jest.Mock).mockRejectedValue(new Error('Verification error'));

      await authController.login(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('me', () => {
    it('should successfully return user profile when authenticated', async () => {
      const req = createMockRequest({ 
        user: { id: 1, email: 'test@example.com', role: 'student' } 
      });
      const res = createMockResponse();

      mockDbQuery([{ 
        id: 1, 
        email: 'test@example.com',
        name: 'Test User', 
        role: 'student',
        created_at: new Date()
      }]);

      (AuthService.createUserProfile as jest.Mock).mockReturnValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        createdAt: new Date()
      });

      await authController.me(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        user: expect.any(Object),
        version: 'v1.0-test'
      });
      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
        [1]
      );
    });

    it('should return 401 when req.user is not set', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();

      await authController.me(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 401 when req.user is undefined', async () => {
      const req = createMockRequest({ user: undefined });
      const res = createMockResponse();

      await authController.me(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 when user is not found in database', async () => {
      const req = createMockRequest({ 
        user: { id: 999, email: 'test@example.com', role: 'student' } 
      });
      const res = createMockResponse();

      mockDbQuery([]);

      await authController.me(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });

    it('should return 500 when database query fails', async () => {
      const req = createMockRequest({ 
        user: { id: 1, email: 'test@example.com', role: 'student' } 
      });
      const res = createMockResponse();

      mockDbQuery([], new Error('Database error'));

      await authController.me(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get user profile',
          requestId: 'test-request-id',
          timestamp: expect.any(String)
        }
      });
    });
  });
});
