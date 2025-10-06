import { AuthService } from '../../src/services/auth.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('../../src/config', () => ({
  config: {
    jwtSecret: 'test-jwt-secret-for-service-tests',
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

describe('AuthService', () => {
  describe('hashPassword', () => {
    it('should successfully hash a password', async () => {
      const password = 'password123';
      const hash = await AuthService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
    });

    it('should return different hashes for the same password due to salt', async () => {
      const password = 'password123';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate hash that starts with bcrypt identifier', async () => {
      const password = 'password123';
      const hash = await AuthService.hashPassword(password);

      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'password123';
      const hash = await bcrypt.hash(password, 12);

      const result = await AuthService.verifyPassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'password123';
      const wrongPassword = 'wrongpassword';
      const hash = await bcrypt.hash(password, 12);

      const result = await AuthService.verifyPassword(wrongPassword, hash);

      expect(result).toBe(false);
    });

    it('should work with previously hashed password', async () => {
      const password = 'mySecurePassword';
      const hash = await AuthService.hashPassword(password);

      const result = await AuthService.verifyPassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false when verifying against different password hash', async () => {
      const password1 = 'password123';
      const password2 = 'differentPassword';
      const hash1 = await AuthService.hashPassword(password1);

      const result = await AuthService.verifyPassword(password2, hash1);

      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT string', () => {
      const user = { id: 1, email: 'test@example.com', role: 'student' };
      const token = AuthService.generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload in token', () => {
      const user = { id: 123, email: 'user@example.com', role: 'instructor' };
      const token = AuthService.generateToken(user);

      const decoded = jwt.decode(token) as any;

      expect(decoded.sub).toBe(123);
      expect(decoded.email).toBe('user@example.com');
      expect(decoded.role).toBe('instructor');
    });

    it('should set expiration to 24 hours from now', () => {
      const user = { id: 1, email: 'test@example.com', role: 'student' };
      const token = AuthService.generateToken(user);

      const decoded = jwt.decode(token) as any;
      const now = Math.floor(Date.now() / 1000);
      const expectedExp = now + (24 * 60 * 60);

      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5);
      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExp - 5);
    });

    it('should include issued at timestamp', () => {
      const user = { id: 1, email: 'test@example.com', role: 'student' };
      const token = AuthService.generateToken(user);

      const decoded = jwt.decode(token) as any;
      const now = Math.floor(Date.now() / 1000);

      expect(decoded.iat).toBeDefined();
      expect(decoded.iat).toBeLessThanOrEqual(now);
      expect(decoded.iat).toBeGreaterThanOrEqual(now - 5);
    });

    it('should use JWT secret from config', () => {
      const user = { id: 1, email: 'test@example.com', role: 'student' };
      const token = AuthService.generateToken(user);

      expect(() => {
        jwt.verify(token, 'test-jwt-secret-for-service-tests');
      }).not.toThrow();
    });

    it('should generate different tokens for different users', () => {
      const user1 = { id: 1, email: 'user1@example.com', role: 'student' };
      const user2 = { id: 2, email: 'user2@example.com', role: 'admin' };

      const token1 = AuthService.generateToken(user1);
      const token2 = AuthService.generateToken(user2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify a valid token', () => {
      const user = { id: 1, email: 'test@example.com', role: 'student' };
      const token = AuthService.generateToken(user);

      const result = AuthService.verifyToken(token);

      expect(result).toBeDefined();
      expect(result.sub).toBe(1);
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('student');
    });

    it('should return correct payload structure', () => {
      const user = { id: 42, email: 'instructor@example.com', role: 'instructor' };
      const token = AuthService.generateToken(user);

      const result = AuthService.verifyToken(token);

      expect(result).toHaveProperty('sub');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('iat');
      expect(result).toHaveProperty('exp');
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        AuthService.verifyToken(invalidToken);
      }).toThrow();
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'notavalidjwt';

      expect(() => {
        AuthService.verifyToken(malformedToken);
      }).toThrow();
    });

    it('should throw error for token signed with different secret', () => {
      const user = { id: 1, email: 'test@example.com', role: 'student' };
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      };
      const tokenWithWrongSecret = jwt.sign(payload, 'wrong-secret', { algorithm: 'HS256' });

      expect(() => {
        AuthService.verifyToken(tokenWithWrongSecret);
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const user = { id: 1, email: 'test@example.com', role: 'student' };
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) - 1800
      };
      const expiredToken = jwt.sign(payload, 'test-jwt-secret-for-service-tests', { algorithm: 'HS256' });

      expect(() => {
        AuthService.verifyToken(expiredToken);
      }).toThrow(jwt.TokenExpiredError);
    });
  });

  describe('createUserProfile', () => {
    it('should return correct profile structure', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        created_at: new Date('2023-01-01')
      };

      const profile = AuthService.createUserProfile(user);

      expect(profile).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        createdAt: new Date('2023-01-01')
      });
    });

    it('should include all required fields', () => {
      const user = {
        id: 42,
        email: 'instructor@example.com',
        name: 'John Instructor',
        role: 'instructor',
        created_at: new Date()
      };

      const profile = AuthService.createUserProfile(user);

      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('email');
      expect(profile).toHaveProperty('name');
      expect(profile).toHaveProperty('role');
      expect(profile).toHaveProperty('createdAt');
    });

    it('should convert created_at to createdAt', () => {
      const createdDate = new Date('2023-06-15T10:30:00Z');
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        created_at: createdDate
      };

      const profile = AuthService.createUserProfile(user);

      expect(profile.createdAt).toBe(createdDate);
      expect(profile).not.toHaveProperty('created_at');
    });

    it('should not include password_hash or other sensitive fields', () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        created_at: new Date(),
        password_hash: 'secret_hash',
        internal_field: 'should_not_appear'
      } as any;

      const profile = AuthService.createUserProfile(user);

      expect(profile).not.toHaveProperty('password_hash');
      expect(profile).not.toHaveProperty('internal_field');
    });

    it('should handle admin role correctly', () => {
      const user = {
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        created_at: new Date()
      };

      const profile = AuthService.createUserProfile(user);

      expect(profile.role).toBe('admin');
    });

    it('should handle different user IDs correctly', () => {
      const user1 = {
        id: 100,
        email: 'user1@example.com',
        name: 'User One',
        role: 'student',
        created_at: new Date()
      };

      const user2 = {
        id: 200,
        email: 'user2@example.com',
        name: 'User Two',
        role: 'instructor',
        created_at: new Date()
      };

      const profile1 = AuthService.createUserProfile(user1);
      const profile2 = AuthService.createUserProfile(user2);

      expect(profile1.id).toBe(100);
      expect(profile2.id).toBe(200);
    });
  });
});
