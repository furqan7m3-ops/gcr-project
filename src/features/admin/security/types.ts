import type { UserStatus } from "@/generated/prisma/enums";

export interface ActiveSessionItem {
  id: string;
  userName: string;
  userEmail: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
}

export interface FailedLoginAttemptItem {
  id: string;
  email: string;
  userName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface LockedAccountItem {
  id: string;
  name: string;
  email: string;
  failedLoginAttempts: number;
  lockedAt: Date | null;
}

export interface AccountStatusBreakdownItem {
  status: UserStatus;
  count: number;
}

export interface PasswordPolicySummary {
  minPasswordLength: number;
  requirePasswordUppercase: boolean;
  requirePasswordNumber: boolean;
  requirePasswordSymbol: boolean;
}

export interface SecurityOverview {
  accountStatusBreakdown: AccountStatusBreakdownItem[];
  passwordPolicy: PasswordPolicySummary;
  activeSessionCount: number;
  lockedAccountCount: number;
  recentFailedAttemptCount: number;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
