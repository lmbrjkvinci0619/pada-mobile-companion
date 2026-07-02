import { fetchCurrentUser, fetchRegistrations, fetchTeams } from '../topscore';

// Mock getValidAccessToken
jest.mock('../auth', () => ({
  getValidAccessToken: jest.fn().mockResolvedValue('fake-token'),
}));

// Mock USE_MOCK_DATA to false for these tests
jest.mock('../../constants/mockData', () => ({
  USE_MOCK_DATA: false,
  MOCK_USER: {},
  MOCK_REGISTRATIONS: [],
  MOCK_TEAMS: [],
  MOCK_EVENTS: [],
}));

describe('TopScore Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn();
  });

  describe('fetchCurrentUser', () => {
    it('maps TopScore user correctly', async () => {
      // Per TopScore API spec v1.0, the response wrapper contains:
      // For single-object endpoints like /api/persons/me, result is the object itself (not an array)
      // { status: 200, count: 1, result: { person_id: 123, ... }, errors: [] }
      const apiResponse = {
        result: {
          person_id: 123,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          avatar_url: 'https://avatar.url',
        },
        status: 200,
        count: 1,
        errors: [],
      };

      ((global as any).fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(apiResponse),
        json: async () => apiResponse,
      });

      const user = await fetchCurrentUser();
      expect(user.firstName).toBe('John');
      expect(user.id).toBe('123');
      expect((global as any).fetch).toHaveBeenCalledWith(expect.stringContaining('/api/persons/me'), expect.any(Object));
    });
  });

  describe('fetchRegistrations', () => {
    it('maps TopScore registrations correctly', async () => {
      // Per TopScore API spec v1.0, result is an array of registration objects
      const apiResponse = {
        result: [
          {
            id: 456,
            type: 'league',
            status: 'active',
            organization_name: 'PADA',
            season_name: 'Spring 2024',
            start_date: '2024-03-01',
          },
        ],
        status: 200,
        count: 1,
        errors: [],
      };

      ((global as any).fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(apiResponse),
        json: async () => apiResponse,
      });

      const result = await fetchRegistrations();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].organizationName).toBe('PADA');
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('fetchTeams', () => {
    it('maps TopScore teams correctly', async () => {
      // Per TopScore API spec v1.0, result is an array of team objects
      const apiResponse = {
        result: [
          {
            id: 789,
            name: 'Disc Doctors',
            division: 'Mixed',
            record: { wins: 5, losses: 2 },
          },
        ],
        status: 200,
        count: 1,
        errors: [],
      };

      ((global as any).fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(apiResponse),
        json: async () => apiResponse,
      });

      const result = await fetchTeams();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Disc Doctors');
      expect(result.data[0].wins).toBe(5);
    });
  });
});
