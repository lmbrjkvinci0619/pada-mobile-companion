/**
 * Test suite for apiClient GET requests with Basic Auth token appended.
 */

let apiClient: any;
let TOPSCORE_USE_OAUTH2: boolean;
let TOPSCORE_CLIENT_ID: string;

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
  let originalUseOAuth: boolean;
  let originalClientId: string;

  beforeAll(() => {
    originalUseOAuth = TOPSCORE_USE_OAUTH2;
    originalClientId = TOPSCORE_CLIENT_ID;
    (process.env as any).EXPO_PUBLIC_TOPSCORE_USE_OAUTH2 = 'false';
    (process.env as any).EXPO_PUBLIC_TOPSCORE_CLIENT_ID = 'test-client-id';
    jest.resetModules();
    const mod = require('@/lib/apiClient');
    apiClient = mod.apiClient;
    TOPSCORE_USE_OAUTH2 = mod.TOPSCORE_USE_OAUTH2;
    TOPSCORE_CLIENT_ID = mod.TOPSCORE_CLIENT_ID;
  });

  afterAll(() => {
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
