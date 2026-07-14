"use server";

import { canAccessAdminArea } from "@/lib/auth/permissions";

import * as userService from "../services/user-service";
import type { AdminUserDetail, ListUsersParams, UsersPage } from "../types";

export async function getUsersPageAction(params: ListUsersParams): Promise<UsersPage> {
  await canAccessAdminArea();
  return userService.listUsers(params);
}

export async function getUserDetailAction(userId: string): Promise<AdminUserDetail> {
  await canAccessAdminArea();
  return userService.getUserDetail(userId);
}
