export type Role = "employee" | "manager" | "admin";

// Public registration allows employee or manager. Admin is only ever assigned by an admin.
export const PUBLIC_ROLES: { value: Role; label: string }[] = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
];

// Listed explicitly rather than spreading PUBLIC_ROLES, which would repeat Manager.
export const ALL_ROLES: { value: Role; label: string }[] = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

/** One entry of GET /auth/managers — `id` is the manager's Employee id. */
export interface SelectableManager {
  id: string;
  name: string;
}

export interface RegistrationDocument {
  fileName: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  data: string;
}

export interface RegistrationDetails {
  name: string;
  fathersName: string;
  temporaryAddress: string;
  permanentAddress: string;
  aadhaarLinkedMobileNumber: string;
  aadhaarNumber: string;
  aadhaarDocument?: RegistrationDocument;
  panNumber: string;
  panDocument?: RegistrationDocument;
  email: string;
  password: string;
  role: Role;
  /** Employee id of the chosen reporting manager. Required for employees when managers exist. */
  reportingManagerId?: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  employee?: Employee | null;
}

export interface UserAccount {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  employee?: { _id: string; name: string; employeeCode: string } | null;
}

export interface Department {
  _id: string;
  name: string;
  description?: string;
}

export interface Employee {
  _id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone?: string;
  department?: Department | string;
  designation?: string;
  manager?: { _id: string; name: string; employeeCode: string } | string;
  dateOfJoining: string;
  status: "active" | "exited";
  basicSalary: number;
}

export interface AttendanceRecord {
  _id: string;
  employee: string | Employee;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "present" | "half_day" | "absent" | "on_leave";
  hoursWorked?: number;
}

export interface DailyTask {
  _id: string;
  employee: string | Employee;
  date: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done" | "pending_approval" | "approved";
  createdAt: string;
  updatedAt: string;
}

export interface WorkRole {
  _id: string;
  area: string;
  areaHindi: string;
  responsibilities: string[];
  sortOrder: number;
  updatedAt: string;
}

export interface LeaveType {
  _id: string;
  name: string;
  code: string;
  defaultAnnualDays: number;
}

export interface LeaveBalance {
  _id: string;
  employee: string;
  leaveType: LeaveType;
  year: number;
  allocated: number;
  used: number;
}

export interface LeaveRequest {
  _id: string;
  employee: string | Employee;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
}

export interface PayrollRun {
  _id: string;
  month: number;
  year: number;
  status: "draft" | "finalized";
  finalizedAt?: string;
}

export interface Payslip {
  _id: string;
  payrollRun: PayrollRun | string;
  employee: string | Employee;
  basicSalary: number;
  lopDays: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  createdAt: string;
}
