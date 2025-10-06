process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.PORT = '4001';
process.env.LOG_LEVEL = 'error';

export interface MockRequest {
  body: any;
  user?: { id: number; email: string; role: string };
  requestId?: string;
  headers?: any;
}

export interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}

export const createMockRequest = (overrides: Partial<MockRequest> = {}): MockRequest => {
  return {
    body: {},
    requestId: 'test-request-id',
    headers: {},
    ...overrides
  };
};

export const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return res;
};

afterEach(() => {
  jest.clearAllMocks();
});
