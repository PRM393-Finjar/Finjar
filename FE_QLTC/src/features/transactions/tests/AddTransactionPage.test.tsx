import { describe, it, expect, vi, beforeEach } from 'vitest';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AddTransactionPage } from '../pages/AddTransactionPage';
import { useCreateTransaction } from '../hooks/useTransactions';
import { useFinancialAccounts } from '@/features/financial-accounts';
import { useUserCategories } from '@/features/categories';
import { useJars } from '@/features/jars/hooks/useJars';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../hooks/useTransactions', () => ({
  useCreateTransaction: vi.fn(),
}));

vi.mock('@/features/financial-accounts', () => ({
  useFinancialAccounts: vi.fn(),
}));

vi.mock('@/features/categories', () => ({
  useUserCategories: vi.fn(),
}));

vi.mock('@/features/jars/hooks/useJars', () => ({
  useJars: vi.fn(),
}));

// Mock ScheduleDateTimePicker since it's complex
vi.mock('@/shared/components/ScheduleDateTimePicker', () => ({
  ScheduleDateTimePicker: ({ value, onChange }: any) => (
    <input
      data-testid="mock-date-picker"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('AddTransactionPage', () => {
  const mockCreateTransaction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCreateTransaction).mockReturnValue({
      mutateAsync: mockCreateTransaction,
      isPending: false,
    } as any);

    vi.mocked(useFinancialAccounts).mockReturnValue({
      data: [{ id: 'acc1', name: 'Cash', connectionMode: 'Manual', isActive: true }],
      isLoading: false,
    } as any);

    vi.mocked(useUserCategories).mockReturnValue({
      data: [{ id: 'cat1', name: 'Food', kind: 'Expense' }],
      isLoading: false,
    } as any);

    vi.mocked(useJars).mockReturnValue({
      data: [{ id: 'jar1', name: 'Necessity', status: 'Active' }, { id: 'jar2', name: 'Play', status: 'Active' }],
      isLoading: false,
    } as any);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AddTransactionPage />
      </BrowserRouter>
    );
  };

  it('renders correctly and defaults to Expense', () => {
    renderComponent();
    expect(screen.getByText('Thêm giao dịch')).toBeInTheDocument();
    expect(screen.getByLabelText('Loại')).toHaveValue('Expense');
  });

  it('validates negative or zero amount', async () => {
    renderComponent();

    const amountInput = screen.getByLabelText('Số tiền');
    fireEvent.change(amountInput, { target: { value: '0' } });

    const submitBtn = screen.getByRole('button', { name: /lưu giao dịch/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getAllByText('Vui lòng nhập số tiền lớn hơn 0.')[0]).toBeInTheDocument();
    });

    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it('submits Expense transaction successfully', async () => {
    renderComponent();

    // Fill amount
    const amountInput = screen.getByLabelText('Số tiền');
    await userEvent.type(amountInput, '100');

    // Select fromJar
    const fromJarSelect = screen.getByLabelText('Hũ nguồn');
    await userEvent.selectOptions(fromJarSelect, 'jar1');

    // Submit
    const submitBtn = screen.getByRole('button', { name: /lưu giao dịch/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(mockCreateTransaction).toHaveBeenCalledWith(expect.objectContaining({
        type: 'Expense',
        amount: 100,
        fromJarId: 'jar1',
        toJarId: null,
      }));
    });
  });

  it('submits Transfer (Jar to Jar) successfully', async () => {
    renderComponent();

    // Change to Transfer
    const typeSelect = screen.getByLabelText('Loại');
    await userEvent.selectOptions(typeSelect, 'Transfer');

    // Fill amount
    const amountInput = screen.getByLabelText('Số tiền');
    await userEvent.type(amountInput, '200');

    // Select fromJar
    const fromJarSelect = screen.getByLabelText('Hũ nguồn');
    await userEvent.selectOptions(fromJarSelect, 'jar1');

    // Select toJar
    const toJarSelect = screen.getByLabelText('Hũ đích');
    await userEvent.selectOptions(toJarSelect, 'jar2');

    // Submit
    const submitBtn = screen.getByRole('button', { name: /lưu giao dịch/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(mockCreateTransaction).toHaveBeenCalledWith(expect.objectContaining({
        type: 'Transfer',
        amount: 200,
        fromJarId: 'jar1',
        toJarId: 'jar2',
      }));
    });
  });

  it('validates same jar for transfer', async () => {
    renderComponent();

    const typeSelect = screen.getByLabelText('Loại');
    await userEvent.selectOptions(typeSelect, 'Transfer');

    const amountInput = screen.getByLabelText('Số tiền');
    await userEvent.type(amountInput, '200');

    const fromJarSelect = screen.getByLabelText('Hũ nguồn');
    await userEvent.selectOptions(fromJarSelect, 'jar1');

    const toJarSelect = screen.getByLabelText('Hũ đích');
    await userEvent.selectOptions(toJarSelect, 'jar1'); // Same jar

    const submitBtn = screen.getByRole('button', { name: /lưu giao dịch/i });
    fireEvent.submit(submitBtn.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Hũ gửi và hũ nhận phải khác nhau.')).toBeInTheDocument();
    });

    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });
});
