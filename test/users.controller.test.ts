import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Response } from 'express';
import { usersController } from '../src/controllers/users.controller';
import { mockUsers, MockUser } from './__mocks__/auth';

interface TestRequest {
  params?: any;
  body?: any;
  query?: any;
  user?: MockUser;
}

describe('Users Controller', () => {
  let mockRequest: TestRequest;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    mockResponse = {
      json: jsonMock,
      status: statusMock
    } as any;

    mockRequest = {
      params: {},
      body: {},
      query: {},
      user: undefined
    };
  });

  describe('GET /users (index)', () => {
    it('should return list of users for admin', async () => {
      mockRequest.user = mockUsers.admin;

      await usersController.index(
        mockRequest as any,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith({
        ok: true,
        route: 'users',
        action: 'index',
        version: 'v1.9'
      });
    });

    it('should include correct response structure', async () => {
      mockRequest.user = mockUsers.admin;

      await usersController.index(
        mockRequest as any,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledTimes(1);
      const response = jsonMock.mock.calls[0][0] as any;
      
      expect(response).toHaveProperty('ok', true);
      expect(response).toHaveProperty('route', 'users');
      expect(response).toHaveProperty('action', 'index');
      expect(response).toHaveProperty('version', 'v1.9');
    });
  });

  describe('POST /users (create)', () => {
    it('should create a new user for admin', async () => {
      mockRequest.user = mockUsers.admin;
      mockRequest.body = {
        email: 'newuser@test.com',
        name: 'New User',
        password: 'password123',
        role: 'student'
      };

      await usersController.create(
        mockRequest as any,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith({
        ok: true,
        route: 'users',
        action: 'create',
        version: 'v1.9'
      });
    });

    it('should include correct response structure', async () => {
      mockRequest.user = mockUsers.admin;

      await usersController.create(
        mockRequest as any,
        mockResponse as Response
      );

      const response = jsonMock.mock.calls[0][0] as any;
      
      expect(response).toHaveProperty('ok', true);
      expect(response).toHaveProperty('route', 'users');
      expect(response).toHaveProperty('action', 'create');
      expect(response).toHaveProperty('version', 'v1.9');
    });
  });

  describe('GET /users/:id (show)', () => {
    it('should return user details for authenticated user', async () => {
      mockRequest.user = mockUsers.student;
      mockRequest.params = { id: '3' };

      await usersController.show(
        mockRequest as any,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith({
        ok: true,
        route: 'users',
        action: 'show',
        id: '3',
        version: 'v1.9'
      });
    });

    it('should allow admin to view any user', async () => {
      mockRequest.user = mockUsers.admin;
      mockRequest.params = { id: '3' };

      await usersController.show(
        mockRequest as any,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith({
        ok: true,
        route: 'users',
        action: 'show',
        id: '3',
        version: 'v1.9'
      });
    });

    it('should allow user to view own profile', async () => {
      mockRequest.user = mockUsers.student;
      mockRequest.params = { id: '3' };

      await usersController.show(
        mockRequest as any,
        mockResponse as Response
      );

      const response = jsonMock.mock.calls[0][0] as any;
      expect(response.id).toBe('3');
    });

    it('should include id in response', async () => {
      mockRequest.user = mockUsers.admin;
      mockRequest.params = { id: '123' };

      await usersController.show(
        mockRequest as any,
        mockResponse as Response
      );

      const response = jsonMock.mock.calls[0][0] as any;
      expect(response).toHaveProperty('id', '123');
    });
  });

  describe('PUT /users/:id (update)', () => {
    it('should update user for authenticated user', async () => {
      mockRequest.user = mockUsers.student;
      mockRequest.params = { id: '3' };
      mockRequest.body = {
        name: 'Updated Name',
        email: 'updated@test.com'
      };

      await usersController.update(
        mockRequest as any,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith({
        ok: true,
        route: 'users',
        action: 'update',
        id: '3',
        version: 'v1.9'
      });
    });

    it('should allow admin to update any user', async () => {
      mockRequest.user = mockUsers.admin;
      mockRequest.params = { id: '5' };
      mockRequest.body = { name: 'Updated Name' };

      await usersController.update(
        mockRequest as any,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith({
        ok: true,
        route: 'users',
        action: 'update',
        id: '5',
        version: 'v1.9'
      });
    });

    it('should include id in response', async () => {
      mockRequest.user = mockUsers.student;
      mockRequest.params = { id: '3' };

      await usersController.update(
        mockRequest as any,
        mockResponse as Response
      );

      const response = jsonMock.mock.calls[0][0] as any;
      expect(response).toHaveProperty('id', '3');
    });
  });

  describe('DELETE /users/:id (remove)', () => {
    it('should delete user for admin', async () => {
      mockRequest.user = mockUsers.admin;
      mockRequest.params = { id: '5' };

      await usersController.remove(
        mockRequest as any,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith({
        ok: true,
        route: 'users',
        action: 'remove',
        id: '5',
        version: 'v1.9'
      });
    });

    it('should include id in response', async () => {
      mockRequest.user = mockUsers.admin;
      mockRequest.params = { id: '123' };

      await usersController.remove(
        mockRequest as any,
        mockResponse as Response
      );

      const response = jsonMock.mock.calls[0][0] as any;
      expect(response).toHaveProperty('id', '123');
    });

    it('should include correct response structure', async () => {
      mockRequest.user = mockUsers.admin;
      mockRequest.params = { id: '1' };

      await usersController.remove(
        mockRequest as any,
        mockResponse as Response
      );

      const response = jsonMock.mock.calls[0][0] as any;
      
      expect(response).toHaveProperty('ok', true);
      expect(response).toHaveProperty('route', 'users');
      expect(response).toHaveProperty('action', 'remove');
      expect(response).toHaveProperty('version', 'v1.9');
    });
  });

  describe('Response format consistency', () => {
    it('all endpoints should return consistent response structure', async () => {
      const endpoints = [
        { method: usersController.index, params: {} },
        { method: usersController.create, params: {} },
        { method: usersController.show, params: { id: '1' } },
        { method: usersController.update, params: { id: '1' } },
        { method: usersController.remove, params: { id: '1' } }
      ];

      for (const endpoint of endpoints) {
        mockRequest.user = mockUsers.admin;
        mockRequest.params = endpoint.params;
        
        await endpoint.method(
          mockRequest as any,
          mockResponse as Response
        );

        const response = jsonMock.mock.calls[jsonMock.mock.calls.length - 1][0] as any;
        
        expect(response).toHaveProperty('ok', true);
        expect(response).toHaveProperty('route', 'users');
        expect(response).toHaveProperty('action');
        expect(response).toHaveProperty('version', 'v1.9');
      }
    });
  });

  describe('Route Protection Integration', () => {
    it('should handle missing authentication', async () => {
      mockRequest.user = undefined;

      await usersController.index(
        mockRequest as any,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalled();
    });

    it('should work with different user roles', async () => {
      const roles: Array<'admin' | 'instructor' | 'student'> = ['admin', 'instructor', 'student'];
      
      for (const role of roles) {
        const user = role === 'admin' ? mockUsers.admin : 
                     role === 'instructor' ? mockUsers.instructor : 
                     mockUsers.student;
        
        mockRequest.user = user;
        
        await usersController.show(
          mockRequest as any,
          mockResponse as Response
        );

        expect(jsonMock).toHaveBeenCalled();
      }
    });
  });
});
