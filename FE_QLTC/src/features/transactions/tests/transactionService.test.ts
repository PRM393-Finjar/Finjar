import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transactionService } from '../services';
import { apiClient } from '@/lib/axios';
import { API_ENDPOINT } from '@/shared/constants/apiEndpoint';

// Mock apiClient
vi.mock('@/lib/axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('transactionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should call get with correct params and map data correctly', async () => {
      const mockResponse = {
        data: [
          {
            id: '123',
            type: 'Income',
            transactionsAmount: 500,
            date: '2023-10-10T00:00:00Z',
            financialAccount: { name: 'Bank' },
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

      const result = await transactionService.list({ pageIndex: 1, pageSize: 20 });

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINT.TRANSACTIONS, {
        params: expect.objectContaining({
          pageIndex: 1,
          pageSize: 20,
        }),
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(expect.objectContaining({
        id: '123',
        type: 'Income',
        amount: 500,
        financialAccountName: 'Bank',
        transactionDate: '2023-10-10T00:00:00Z',
      }));
      expect(result.pagination).toEqual(mockResponse.pagination);
    });
  });

  describe('getById', () => {
    it('should call get and map transaction detail correctly', async () => {
      const mockRow = {
        id: '123',
        type: 'Expense',
        transactionsAmount: 100,
        date: '2023-10-10T00:00:00Z',
        fromJarId: 'jar1',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockRow);

      const result = await transactionService.getById('123');

      expect(apiClient.get).toHaveBeenCalledWith(`${API_ENDPOINT.TRANSACTIONS}/123`);
      expect(result.id).toBe('123');
      expect(result.type).toBe('Expense');
      expect(result.fromJarId).toBe('jar1');
    });
  });

  describe('create', () => {
    it('should call post with correct payload and return mapped item', async () => {
      const payload = {
        type: 'Income' as const,
        amount: 1000,
        financialAccountId: 'acc1',
        date: '2023-10-10T00:00:00Z',
      };

      const mockResponse = {
        id: '999',
        type: 'Income',
        transactionsAmount: 1000,
        date: '2023-10-10T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      const result = await transactionService.create(payload);

      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINT.TRANSACTIONS, expect.objectContaining({
        type: 'Income',
        transactionsAmount: 1000,
        financialAccountId: 'acc1',
        date: '2023-10-10T00:00:00Z',
      }));

      expect(result.id).toBe('999');
      expect(result.amount).toBe(1000);
    });
  });

  describe('update', () => {
    it('should call patch and return mapped item', async () => {
      const payload = { transactionsAmount: 2000 };
      const mockResponse = {
        id: '999',
        type: 'Income',
        transactionsAmount: 2000,
        date: '2023-10-10T00:00:00Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValueOnce(mockResponse);

      const result = await transactionService.update('999', payload);

      expect(apiClient.patch).toHaveBeenCalledWith(`${API_ENDPOINT.TRANSACTIONS}/999`, payload);
      expect(result.amount).toBe(2000);
    });
  });

  describe('remove', () => {
    it('should call delete endpoint', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({ success: true });

      await transactionService.remove('123');

      expect(apiClient.delete).toHaveBeenCalledWith(`${API_ENDPOINT.TRANSACTIONS}/123`);
    });
  });
});
