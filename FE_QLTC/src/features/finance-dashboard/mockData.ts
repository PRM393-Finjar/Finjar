export const NAV_TABS = [
  "Overview",
  "Transactions",
  "Reports",
  "Hire Bookkeeper",
] as const;

export type NavTab = (typeof NAV_TABS)[number];

export const MONTH_RANGE_OPTIONS = [
  "1-6 Months",
  "3 Months",
  "12 Months",
  "Year to date",
] as const;

export const CASH_FLOW_MONTHS = [
  "Nov 20",
  "Dec 20",
  "Jan 21",
  "Feb 21",
  "Mar 21",
  "Apr 21",
  "Apr 22",
] as const;

export const cashFlowSummary = {
  inflow: 80_000,
  outflow: 12_000,
  netChanges: 2_000,
};

/** Dữ liệu cash flow theo tháng (USD gốc) */
export const cashFlowByMonth: Record<
  (typeof CASH_FLOW_MONTHS)[number],
  { inflow: number; outflow: number; netChanges: number }
> = {
  "Nov 20": { inflow: 62_000, outflow: 18_000, netChanges: 44_000 },
  "Dec 20": { inflow: 71_000, outflow: 15_000, netChanges: 56_000 },
  "Jan 21": { inflow: 68_000, outflow: 22_000, netChanges: 46_000 },
  "Feb 21": { inflow: 75_000, outflow: 14_000, netChanges: 61_000 },
  "Mar 21": { inflow: 78_000, outflow: 11_000, netChanges: 67_000 },
  "Apr 21": { inflow: 80_000, outflow: 12_000, netChanges: 68_000 },
  "Apr 22": { inflow: 85_000, outflow: 10_500, netChanges: 74_500 },
};

export function getCashFlowForMonth(month: string) {
  const key = month as (typeof CASH_FLOW_MONTHS)[number];
  return cashFlowByMonth[key] ?? cashFlowSummary;
}

export const profitLossSummary = {
  inflowToday: 192,
  changePercent: 12,
  inflowTotal: 80_000,
  outflowTotal: 2_000,
};

export const profitLossChartData = [
  { month: "Nov 20", value: 120 },
  { month: "Dec 20", value: 95 },
  { month: "Jan 21", value: 140 },
  { month: "Feb 21", value: 110 },
  { month: "Mar 21", value: 160 },
  { month: "Apr 21", value: 130 },
  { month: "Apr 21", value: 175 },
  { month: "Apr 22", value: 150 },
  { month: "Apr 22", value: 192 },
];

export const payableInvoices = [
  { labelKey: "comingDue" as const, amount: 0 },
  { labelKey: "days30Overdue" as const, amount: 0 },
  { labelKey: "days50Overdue" as const, amount: 0 },
] as const;

export const payableBills = [
  { labelKey: "comingDue" as const, amount: 0 },
  { labelKey: "days30Overdue" as const, amount: 0 },
  { labelKey: "days60Overdue" as const, amount: 0 },
] as const;

export const netIncomeRowKeys = [
  { labelKey: "rowIncome" as const, y2020: 44_491.53, y2021: 244_734.7 },
  { labelKey: "rowExpense" as const, y2020: 162_383.46, y2021: 242_466.6 },
  { labelKey: "rowFiscalNet" as const, y2020: -117_891.93, y2021: 2_386.1 },
] as const;

export const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

export const formatUsdCompact = (value: number) =>
  value >= 1000
    ? `$${Math.round(value / 1000)}${value % 1000 === 0 ? "000" : ""}`
    : formatUsd(value);

export const mockUser = {
  id: "usr-001",
  name: "Alex Morgan",
  email: "alex.morgan@template.io",
  role: "Business Owner",
  company: "Template Inc.",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=finance",
  memberSince: "Jan 2020",
  plan: "Pro",
};

export const calendarEvents = [
  {
    id: "1",
    titleKey: "eventTax" as const,
    date: "May 20, 2026",
    timeKey: "allDay" as const,
  },
  {
    id: "2",
    titleKey: "eventPayroll" as const,
    date: "May 18, 2026",
    time: "10:00 AM",
  },
  {
    id: "3",
    titleKey: "eventVendor" as const,
    date: "May 16, 2026",
    time: "2:00 PM",
  },
  {
    id: "4",
    titleKey: "eventQuarterly" as const,
    date: "May 22, 2026",
    time: "9:00 AM",
  },
] as const;

export const notifications = [
  {
    id: "n1",
    titleKey: "notifInvoicePaid" as const,
    bodyKey: "notifInvoicePaidBody" as const,
    time: "2m ago",
    unread: true,
  },
  {
    id: "n2",
    titleKey: "notifBillDue" as const,
    bodyKey: "notifBillDueBody" as const,
    time: "1h ago",
    unread: true,
  },
  {
    id: "n3",
    titleKey: "notifWeekly" as const,
    bodyKey: "notifWeeklyBody" as const,
    time: "Yesterday",
    unread: false,
  },
] as const;

export const chatMessages = [
  {
    id: "c1",
    from: "support" as const,
    textKey: "chatHello" as const,
    time: "10:32 AM",
  },
  {
    id: "c2",
    from: "user" as const,
    textKey: "chatThanks" as const,
    time: "10:35 AM",
  },
  {
    id: "c3",
    from: "support" as const,
    textKey: "chatAttach" as const,
    time: "10:36 AM",
  },
] as const;

export type TransactionType = "Income" | "Expense";

export const mockTransactions = [
  {
    id: "tx-1",
    date: "May 14, 2026",
    description: "Stripe payout",
    category: "Sales",
    type: "Income" as TransactionType,
    amount: 12_400,
    status: "Completed",
  },
  {
    id: "tx-2",
    date: "May 13, 2026",
    description: "AWS infrastructure",
    category: "Software",
    type: "Expense" as TransactionType,
    amount: 890,
    status: "Completed",
  },
  {
    id: "tx-3",
    date: "May 12, 2026",
    description: "Client retainer — Nova Labs",
    category: "Services",
    type: "Income" as TransactionType,
    amount: 5_000,
    status: "Completed",
  },
  {
    id: "tx-4",
    date: "May 11, 2026",
    description: "Office supplies",
    category: "Operations",
    type: "Expense" as TransactionType,
    amount: 234.5,
    status: "Pending",
  },
  {
    id: "tx-5",
    date: "May 10, 2026",
    description: "Payroll — May cycle",
    category: "Payroll",
    type: "Expense" as TransactionType,
    amount: 18_200,
    status: "Completed",
  },
  {
    id: "tx-6",
    date: "May 09, 2026",
    description: "Refund — duplicate charge",
    category: "Adjustments",
    type: "Expense" as TransactionType,
    amount: 120,
    status: "Completed",
  },
] as const;

export const reportSummaries = [
  {
    id: "r1",
    title: "Profit & Loss",
    period: "Q1 2026",
    status: "Ready",
    updated: "May 14, 2026",
  },
  {
    id: "r2",
    title: "Balance Sheet",
    period: "Q1 2026",
    status: "Ready",
    updated: "May 14, 2026",
  },
  {
    id: "r3",
    title: "Cash Flow Statement",
    period: "Jan–Apr 2026",
    status: "Ready",
    updated: "May 12, 2026",
  },
  {
    id: "r4",
    title: "Tax Summary",
    period: "FY 2025",
    status: "Draft",
    updated: "May 08, 2026",
  },
] as const;

export const bookkeepers = [
  {
    id: "bk-1",
    name: "Sarah Chen, CPA",
    rating: 4.9,
    reviews: 128,
    rate: "$85/hr",
    specialty: "Small business & startups",
    available: true,
  },
  {
    id: "bk-2",
    name: "Marcus Webb",
    rating: 4.7,
    reviews: 94,
    rate: "$72/hr",
    specialty: "E-commerce & inventory",
    available: true,
  },
  {
    id: "bk-3",
    name: "Elena Rodriguez",
    rating: 5.0,
    reviews: 56,
    rate: "$95/hr",
    specialty: "Tax planning & compliance",
    available: false,
  },
] as const;
