"use server";

import { canAccessAdminArea } from "@/lib/auth/permissions";

import * as securityService from "../services/security-service";
import type {
  ActiveSessionItem,
  FailedLoginAttemptItem,
  ListParams,
  LockedAccountItem,
  Paged,
  SecurityOverview,
} from "../types";

export async function getSecurityOverviewAction(): Promise<SecurityOverview> {
  await canAccessAdminArea();
  return securityService.getSecurityOverview();
}

export async function getActiveSessionsAction(
  params: ListParams,
): Promise<Paged<ActiveSessionItem>> {
  await canAccessAdminArea();
  return securityService.listActiveSessions(params);
}

export async function getFailedLoginAttemptsAction(
  params: ListParams,
): Promise<Paged<FailedLoginAttemptItem>> {
  await canAccessAdminArea();
  return securityService.listFailedLoginAttempts(params);
}

export async function getLockedAccountsAction(
  params: ListParams,
): Promise<Paged<LockedAccountItem>> {
  await canAccessAdminArea();
  return securityService.listLockedAccounts(params);
}
