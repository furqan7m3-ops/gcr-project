"use server";

import { canAccessAdminArea } from "@/lib/auth/permissions";

import * as analyticsService from "../services/analytics-service";
import type { ReportsData } from "../types";

export async function getReportsDataAction(): Promise<ReportsData> {
  await canAccessAdminArea();
  return analyticsService.getReportsData();
}
