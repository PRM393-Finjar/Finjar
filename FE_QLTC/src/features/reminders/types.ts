export type ReminderFrequency =
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Quarterly"
  | "Yearly";

export type ReminderStatus =
  | "Active"
  | "Paused"
  | "Completed"
  | "Cancelled";

export interface ReminderItem {
  id: string;
  title: string;
  amount: number;
  frequency: string;
  nextDueDate: string;
  status: string;
}

export interface CreateReminderPayload {
  title: string;
  amount: number;
  frequency: ReminderFrequency;
  dayOfMonth?: number | null;
  startDate: string;
  categoryId?: string | null;
  notifyDaysBefore?: number | null;
  note?: string | null;
}

export interface UpdateReminderPayload {
  title?: string;
  amount?: number;
  frequency?: ReminderFrequency;
  dayOfMonth?: number | null;
  status?: ReminderStatus;
  notifyDaysBefore?: number | null;
  note?: string | null;
}
