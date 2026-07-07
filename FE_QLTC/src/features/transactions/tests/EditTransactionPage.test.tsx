import { describe, it, expect, vi, beforeEach } from 'vitest';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { EditTransactionPage } from '../pages/EditTransactionPage';
import { useTransaction, useUpdateTransaction } from '../hooks/useTransactions';
import { useUserCategories } from '@/features/categories';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'test-id' })
  };
});

vi.mock('../hooks/useTransactions', () => ({
  useTransaction: vi.fn(),
  useUpdateTransaction: vi.fn(),
}));

vi.mock('@/features/categories', () => ({
  useUserCategories: vi.fn(),
}));

describe('EditTransactionPage', () => {
  const mockUpdateTransaction = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useUpdateTransaction).mockReturnValue({
      mutateAsync: mockUpdateTransaction,
      isPending: false,
    } as any);

    vi.mocked(useUserCategories).mockReturnValue({
      data: [{ id: 'cat1', name: 'Food', kind: 'Expense' }],
      isLoading: false,
    } as any);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <EditTransactionPage />
      </BrowserRouter>
    );
  };

  it('renders loading state', () => {
    vi.mocked(useTransaction).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: mockRefetch,
    } as any);

    renderComponent();
    expect(screen.getByText('Đang tải chi tiết giao dịch...')).toBeInTheDocument();
  });

  it('renders form populated with transaction data', async () => {
    vi.mocked(useTransaction).mockReturnValue({
      data: {
        id: 'test-id',
        type: 'Expense',
        amount: 50000,
        transactionDate: new Date().toISOString(),
        categoryId: 'cat1',
        note: 'Buy coffee'
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any);

    renderComponent();
    
    expect(screen.getByText('Sửa giao dịch')).toBeInTheDocument();
    
    const amountInput = screen.getByLabelText('Số tiền');
    expect(amountInput).toHaveValue(50000);

    const categorySelect = screen.getByLabelText('Danh mục');
    expect(categorySelect).toHaveValue('cat1');

    const noteInput = screen.getByLabelText('Ghi chú');
    expect(noteInput).toHaveValue('Buy coffee');
  });

  it('submits updated data successfully', async () => {
    vi.mocked(useTransaction).mockReturnValue({
      data: {
        id: 'test-id',
        type: 'Expense',
        amount: 50000,
        transactionDate: new Date().toISOString(),
        categoryId: 'cat1',
        note: 'Buy coffee'
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any);

    renderComponent();
    
    // Change amount
    const amountInput = screen.getByLabelText('Số tiền');
    fireEvent.change(amountInput, { target: { value: '60000' } });

    // Change note
    const noteInput = screen.getByLabelText('Ghi chú');
    fireEvent.change(noteInput, { target: { value: 'Buy coffee and cake' } });

    const submitBtn = screen.getByRole('button', { name: /lưu thay đổi/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(mockUpdateTransaction).toHaveBeenCalledWith({
        id: 'test-id',
        payload: {
          transactionsAmount: 60000,
          categoryId: 'cat1',
          note: 'Buy coffee and cake'
        }
      });
    });
  });

  it('validates zero amount', async () => {
    vi.mocked(useTransaction).mockReturnValue({
      data: {
        id: 'test-id',
        type: 'Expense',
        amount: 50000,
        transactionDate: new Date().toISOString(),
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any);

    renderComponent();
    
    const amountInput = screen.getByLabelText('Số tiền');
    fireEvent.change(amountInput, { target: { value: '0' } });

    const submitBtn = screen.getByRole('button', { name: /lưu thay đổi/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getAllByText('Vui lòng nhập số tiền lớn hơn 0.')[0]).toBeInTheDocument();
    });

    expect(mockUpdateTransaction).not.toHaveBeenCalled();
  });
});
