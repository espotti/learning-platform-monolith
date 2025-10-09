import { Response, NextFunction } from 'express';
import { jest } from '@jest/globals';

export interface MockUser {
  id: number;
  email: string;
  role: 'admin' | 'instructor' | 'student';
}

interface AuthRequest {
  user?: MockUser;
  requestId?: string;
  params?: any;
  body?: any;
  query?: any;
}

export const mockAuthenticate = (user?: MockUser) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (user) {
      req.user = user;
      next();
    } else {
      res.status(401).json({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    }
  };
};

export const mockRequireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    }

    next();
  };
};

export const mockUsers = {
  admin: { id: 1, email: 'admin@test.com', role: 'admin' as const },
  instructor: { id: 2, email: 'instructor@test.com', role: 'instructor' as const },
  student: { id: 3, email: 'student@test.com', role: 'student' as const }
};
