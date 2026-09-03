/**
 * Test suite for apiClient GET requests with Basic Auth token appended.
 */

import { apiClient, TOPSCORE_USE_OAUTH2, TOPSCORE_CLIENT_ID } from '@/lib/apiClient';

// Mock fetch globally
global.fetch = jest.fn();

function mockFetchResponse(data: any, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: { get: () => null },
  });
}

describe('apiClient GET with Basic Auth', () => {
  const originalUseOAuth = TOPSCORE_USE_OAUTH2;
  const originalClientId = TOPSCORE_CLIENT_ID;

  beforeAll(() => {
    // Force Basic Auth mode for test
    (process.env as any).EXPO_PUBLIC_TOPSCORE_USE_OAUTH2 = 'false';
    (process.env as any).EXPO_PUBLIC_TOPSCORE_CLIENT_ID = 'test-client-id';
  });

  afterAll(() => {
    // Restore env vars
    (process.env as any).EXPO_PUBLIC_TOPSCORE_USE_OAUTH2 = originalUseOAuth ? 'true' : 'false';
    (process.env as any).EXPO_PUBLIC_TOPSCORE_CLIENT_ID = originalClientId;
  });

  it('appends auth_token to GET URL', async () => {
    const dummyData = { status: 200, count: 0, result: [] };
    mockFetchResponse(dummyData);
    const result = await apiClient.get('/api/test', {});
    expect(result).toEqual(dummyData.result);
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('auth_token=test-client-id');
  });
});
