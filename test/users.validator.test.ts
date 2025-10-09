import { describe, it, expect } from '@jest/globals';
import { UserValidator } from '../src/utils/validation';

describe('UserValidator', () => {
  describe('validateCreateUser', () => {
    it('should validate correct user data', () => {
      const validData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        role: 'student'
      };

      const result = UserValidator.validateCreateUser(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require email', () => {
      const invalidData = {
        name: 'Test User',
        password: 'password123'
      };

      const result = UserValidator.validateCreateUser(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Email is required and must be a string'
      });
    });

    it('should validate email format', () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'password123'
      };

      const result = UserValidator.validateCreateUser(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Invalid email format'
      });
    });

    it('should require name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = UserValidator.validateCreateUser(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Name is required and must be a string'
      });
    });

    it('should reject empty name', () => {
      const invalidData = {
        email: 'test@example.com',
        name: '   ',
        password: 'password123'
      };

      const result = UserValidator.validateCreateUser(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Name cannot be empty'
      });
    });

    it('should reject name longer than 255 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'a'.repeat(256),
        password: 'password123'
      };

      const result = UserValidator.validateCreateUser(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Name must be 255 characters or less'
      });
    });

    it('should require password', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const result = UserValidator.validateCreateUser(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'password',
        message: 'Password is required and must be a string'
      });
    });

    it('should require password to be at least 6 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        password: '12345'
      };

      const result = UserValidator.validateCreateUser(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'password',
        message: 'Password must be at least 6 characters long'
      });
    });

    it('should validate role if provided', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        role: 'superadmin'
      };

      const result = UserValidator.validateCreateUser(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'role',
        message: 'Role must be one of: admin, instructor, student'
      });
    });

    it('should accept valid roles', () => {
      const roles = ['admin', 'instructor', 'student'];
      
      roles.forEach(role => {
        const validData = {
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
          role
        };

        const result = UserValidator.validateCreateUser(validData);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateUpdateUser', () => {
    it('should validate correct update data', () => {
      const validData = {
        name: 'Updated Name',
        email: 'newemail@example.com'
      };

      const result = UserValidator.validateUpdateUser(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow partial updates', () => {
      const validData = { name: 'Updated Name' };

      const result = UserValidator.validateUpdateUser(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate email format if provided', () => {
      const invalidData = { email: 'invalid-email' };

      const result = UserValidator.validateUpdateUser(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Invalid email format'
      });
    });

    it('should validate name if provided', () => {
      const invalidData = { name: '   ' };

      const result = UserValidator.validateUpdateUser(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Name cannot be empty'
      });
    });

    it('should validate password if provided', () => {
      const invalidData = { password: '123' };

      const result = UserValidator.validateUpdateUser(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'password',
        message: 'Password must be at least 6 characters long'
      });
    });

    it('should validate role if provided', () => {
      const invalidData = { role: 'invalid' };

      const result = UserValidator.validateUpdateUser(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'role',
        message: 'Role must be one of: admin, instructor, student'
      });
    });
  });
});
