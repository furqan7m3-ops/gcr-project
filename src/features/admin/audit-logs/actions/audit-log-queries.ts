"use server";

import { canAccessAdminArea } from "@/lib/auth/permissions";

import * as service from "../services/audit-log-service";
import type { AuditLogsPage, ListAuditLogParams } from "../types";

export async function getAuditLogsPageAction(params: ListAuditLogParams): Promise<AuditLogsPage> {
  await canAccessAdminArea();
  return service.listAuditLogs(params);
}
