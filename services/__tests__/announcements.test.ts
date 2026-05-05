import { fetchAnnouncements, markAnnouncementAsRead, createAnnouncement } from '../announcements';
import * as auth from '../auth';

jest.mock('../auth');
jest.mock('../supabase');

describe('Announcements Service', () => {
  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.skip('fetchAnnouncements', () => {
    it('fetches and maps announcements correctly', async () => {
      const mockData = [
        {
          id: 'ann-1',
          title: 'League Update',
          content: 'Matches start tomorrow!',
          target_type: 'league',
          announcement_reads: [{ user_id: userId }],
        },
      ];

      const result = await fetchAnnouncements(userId);
      expect(result).toHaveLength(1);
    });

    it('handles errors gracefully', async () => {
      const result = await fetchAnnouncements(userId);
      expect(result).toEqual([]);
    });
  });

  describe.skip('markAnnouncementAsRead', () => {
    it('calls upsert on announcement_reads', async () => {
      await markAnnouncementAsRead('ann-1', userId);
    });
  });

  describe('createAnnouncement', () => {
    it('returns false if not authenticated', async () => {
      (auth.getValidAccessToken as jest.Mock).mockResolvedValue(null);
      const success = await createAnnouncement({} as any);
      expect(success).toBe(false);
    });
  });
});