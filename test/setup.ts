import { jest } from '@jest/globals';

jest.setTimeout(5000);

jest.mock('../src/db', () => ({
  db: {
    query: jest.fn(),
    getClient: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    healthCheck: jest.fn(),
    smokeTest: jest.fn(),
    getConnectionStatus: jest.fn(),
    getPoolStats: jest.fn()
  }
}));

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

afterEach(() => {
  jest.clearAllMocks();
});
