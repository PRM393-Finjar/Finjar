import { describe, it, expect, vi, beforeEach } from 'vitest';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TransactionDetailPage } from '../pages/TransactionDetailPage';
import { useTransaction, useDeleteTransaction, useRestoreTransaction } from '../hooks/useTransactions';

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
  useDeleteTransaction: vi.fn(),
  useRestoreTransaction: vi.fn(),
}));

describe('TransactionDetailPage', () => {
  const mockDeleteTransaction = vi.fn();
  const mockRestoreTransaction = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useDeleteTransaction).mockReturnValue({
      mutate: mockDeleteTransaction,
      isPending: false,
    } as any);

    vi.mocked(useRestoreTransaction).mockReturnValue({
      mutate: mockRestoreTransaction,
      isPending: false,
    } as any);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <TransactionDetailPage />
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

  it('renders error state', () => {
    vi.mocked(useTransaction).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    } as any);

    renderComponent();
    expect(screen.getByText('Không tải được chi tiết giao dịch.')).toBeInTheDocument();
  });

  it('renders transaction detail with Edit and Delete buttons when active', () => {
    vi.mocked(useTransaction).mockReturnValue({
      data: {
        id: 'test-id',
        type: 'Expense',
        amount: 50000,
        transactionDate: new Date().toISOString(),
        isDeleted: false,
        note: 'Buy coffee'
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any);

    renderComponent();
    expect(screen.getByText('Chi tiết giao dịch')).toBeInTheDocument();
    expect(screen.getByText('Sửa')).toBeInTheDocument();
    expect(screen.getByText('Xoá')).toBeInTheDocument();
    expect(screen.queryByText('Khôi phục')).not.toBeInTheDocument();
  });

  it('renders transaction detail with Restore button when deleted', () => {
    vi.mocked(useTransaction).mockReturnValue({
      data: {
        id: 'test-id',
        type: 'Expense',
        amount: 50000,
        transactionDate: new Date().toISOString(),
        isDeleted: true,
        note: 'Buy coffee'
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any);

    renderComponent();
    expect(screen.getByText('Đã xoá')).toBeInTheDocument();
    expect(screen.getByText('Khôi phục')).toBeInTheDocument();
    expect(screen.queryByText('Sửa')).not.toBeInTheDocument();
    expect(screen.queryByText('Xoá')).not.toBeInTheDocument();
  });

  it('calls deleteTransaction on Delete click', async () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    vi.mocked(useTransaction).mockReturnValue({
      data: {
        id: 'test-id',
        type: 'Expense',
        amount: 50000,
        transactionDate: new Date().toISOString(),
        isDeleted: false,
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any);

    renderComponent();
    
    const deleteBtn = screen.getByText('Xoá');
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalledWith('Bạn có chắc chắn muốn xoá giao dịch này không?');
    expect(mockDeleteTransaction).toHaveBeenCalledWith('test-id', expect.any(Object));

    confirmSpy.mockRestore();
  });

  it('calls restoreTransaction on Restore click', async () => {
    vi.mocked(useTransaction).mockReturnValue({
      data: {
        id: 'test-id',
        type: 'Expense',
        amount: 50000,
        transactionDate: new Date().toISOString(),
        isDeleted: true,
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any);

    renderComponent();
    
    const restoreBtn = screen.getByText('Khôi phục');
    fireEvent.click(restoreBtn);

    expect(mockRestoreTransaction).toHaveBeenCalledWith('test-id', expect.any(Object));
  });
});
