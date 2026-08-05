// Static "Attendance & Salary Sheet — Feb 2026" dataset for
// HURRY'S FOOD & BEVERAGES PRIVATE LIMITED, transcribed from the source sheet.
//
// Data-quality notes are surfaced in the UI (not silently fixed):
//  - Employee ID HP021 is shared by Sonu & Lalit (flagged with `dupId`).
//  - The sheet's S.No column repeats; the roster is renumbered 1–9 by order.
//  - Blank "Spl. Remarks" is treated as "Pending".
//  - Company-level cash-flow figures are kept out of the per-employee view.

export type SalaryStatus = "Paid" | "Pending" | "Hold" | "Cash Required";

export interface SalaryRow {
  id: string;
  name: string;
  role: string;
  gross: number;
  advance: number;
  penalty: number;
  inHand: number;
  present: number;
  absent: number;
  off: number;
  payable: number;
  status: SalaryStatus;
  /** true when this ID is shared with another employee */
  dupId?: boolean;
}

/** Kept as month + year rather than a fixed label so the period can be localised. */
export const SALARY_MONTH_NUMBER = 2;
export const SALARY_YEAR = 2026;
export const DAYS_IN_MONTH = 28;

export const SALARY_SHEET: SalaryRow[] = [
  { id: "HP006", name: "Monu", role: "F&B Assistant", gross: 11000, advance: 0, penalty: 0, inHand: 11000, present: 28, absent: 0, off: 0, payable: 28, status: "Cash Required" },
  { id: "HP007", name: "Gulab Sen", role: "Head Cook", gross: 22000, advance: 4500, penalty: 0, inHand: 17500, present: 28, absent: 0, off: 0, payable: 28, status: "Pending" },
  { id: "HP010", name: "Shibam", role: "Kitchen Helper", gross: 9000, advance: 0, penalty: 0, inHand: 9000, present: 26, absent: 0, off: 2, payable: 28, status: "Pending" },
  { id: "HP016", name: "Dinesh", role: "Cook", gross: 16000, advance: 0, penalty: 0, inHand: 16000, present: 26, absent: 0, off: 2, payable: 28, status: "Paid" },
  { id: "HP019", name: "Pankaj Singh", role: "Kitchen Helper", gross: 13000, advance: 0, penalty: 0, inHand: 13000, present: 26, absent: 0, off: 2, payable: 28, status: "Paid" },
  { id: "HP020", name: "Shubham", role: "Kitchen Helper", gross: 12000, advance: 1000, penalty: 0, inHand: 8000, present: 21, absent: 7, off: 0, payable: 21, status: "Pending" },
  { id: "HP021", name: "Sonu", role: "Kitchen Helper", gross: 10000, advance: 0, penalty: 0, inHand: 5357, present: 14, absent: 13, off: 1, payable: 15, status: "Hold", dupId: true },
  { id: "HP021", name: "Lalit", role: "Kitchen Helper", gross: 9000, advance: 0, penalty: 0, inHand: 9000, present: 28, absent: 0, off: 0, payable: 28, status: "Paid", dupId: true },
  { id: "HP022", name: "Roshan", role: "Kitchen Helper", gross: 22000, advance: 0, penalty: 0, inHand: 22000, present: 3, absent: 0, off: 25, payable: 28, status: "Pending" },
];

/** Translation keys for the sheet's own status vocabulary. */
export const STATUS_KEY: Record<SalaryStatus, string> = {
  Paid: "salaryStatus.paid",
  Pending: "salaryStatus.pending",
  Hold: "salaryStatus.hold",
  "Cash Required": "salaryStatus.cashRequired",
};

/** Deterministic avatar hue so each person keeps a stable colour. */
export const avatarColor = (seed: string): string => {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h}, 42%, 46%)`;
};

/** Tailwind classes for the status pill + roster dot. */
export const STATUS_PILL: Record<SalaryStatus, string> = {
  Paid: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Hold: "bg-rose-100 text-rose-700",
  "Cash Required": "bg-indigo-100 text-indigo-700",
};

export const STATUS_DOT: Record<SalaryStatus, string> = {
  Paid: "bg-emerald-500",
  Pending: "bg-amber-500",
  Hold: "bg-rose-500",
  "Cash Required": "bg-indigo-500",
};

export interface DerivedRow {
  perDay: number;
  /** salary for payable days, before deductions */
  earned: number;
  attendancePct: number;
}

export function derive(r: SalaryRow): DerivedRow {
  return {
    perDay: Math.round(r.gross / DAYS_IN_MONTH),
    earned: r.inHand + r.advance + r.penalty,
    attendancePct: r.payable > 0 ? Math.round((r.present / r.payable) * 100) : 0,
  };
}
