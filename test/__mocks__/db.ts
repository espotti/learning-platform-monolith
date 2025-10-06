import { QueryResult } from 'pg';

const mockQuery = jest.fn<Promise<QueryResult<any>>, [string, any[]?]>();

export const db = {
  query: mockQuery,
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  healthCheck: jest.fn().mockResolvedValue(true),
  smokeTest: jest.fn().mockResolvedValue({ success: true, userCount: 0 }),
  getConnectionStatus: jest.fn().mockReturnValue(true),
  getClient: jest.fn(),
  getPoolStats: jest.fn()
};

export const mockDbQuery = (rows: any[] = [], error: Error | null = null) => {
  if (error) {
    mockQuery.mockRejectedValueOnce(error);
  } else {
    mockQuery.mockResolvedValueOnce({
      rows,
      command: 'SELECT',
      rowCount: rows.length,
      oid: 0,
      fields: []
    } as QueryResult<any>);
  }
};

export const resetDbMock = () => {
  mockQuery.mockClear();
};
