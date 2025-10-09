export const db = {
  query: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  getClient: jest.fn(),
  healthCheck: jest.fn(),
  smokeTest: jest.fn(),
  getConnectionStatus: jest.fn(),
  getPoolStats: jest.fn(),
};
