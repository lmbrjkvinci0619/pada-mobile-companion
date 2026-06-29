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
      const apiResponse = {
        id: 123,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        avatar_url: 'https://avatar.url',
      };

      ((global as any).fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(apiResponse),
        json: async () => apiResponse,
      });

      const user = await fetchCurrentUser();
      expect(user.firstName).toBe('John');
      expect((global as any).fetch).toHaveBeenCalledWith(expect.stringContaining('/api/persons/me'), expect.any(Object));
    });
  });

  describe('fetchRegistrations', () => {
    it('maps TopScore registrations correctly', async () => {
      const apiResponse = [
        {
          id: 456,
          type: 'league',
          status: 'active',
          organization_name: 'PADA',
          season_name: 'Spring 2024',
          start_date: '2024-03-01',
        },
      ];

      ((global as any).fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(apiResponse),
        json: async () => apiResponse,
      });

      const regs = await fetchRegistrations();
      expect(regs).toHaveLength(1);
      expect(regs[0].organizationName).toBe('PADA');
    });
  });

  describe('fetchTeams', () => {
    it('maps TopScore teams correctly', async () => {
      const apiResponse = [
        {
          id: 789,
          name: 'Disc Doctors',
          division: 'Mixed',
          record: { wins: 5, losses: 2 },
        },
      ];

      ((global as any).fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(apiResponse),
        json: async () => apiResponse,
      });

      const teams = await fetchTeams();
      expect(teams).toHaveLength(1);
      expect(teams[0].name).toBe('Disc Doctors');
      expect(teams[0].wins).toBe(5);
    });
  });
});
