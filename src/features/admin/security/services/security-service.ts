import type { SessionUser } from "@/auth/session";
import { recordAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/system-settings";
import { ActivityAction, UserStatus } from "@/generated/prisma/enums";

import { AdminSecurityServiceError } from "../lib/errors";
import type {
  ActiveSessionItem,
  FailedLoginAttemptItem,
  ListParams,
  LockedAccountItem,
  Paged,
  SecurityOverview,
} from "../types";

const DEFAULT_PAGE_SIZE = 20;
const FAILED_ATTEMPT_WINDOW_MS = 24 * 60 * 60_000;

function paginate(total: number, page: number, pageSize: number) {
  return { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getSecurityOverview(): Promise<SecurityOverview> {
  const [statusRows, settings, activeSessionCount, lockedAccountCount, recentFailedAttemptCount] =
    await Promise.all([
      prisma.user.groupBy({ by: ["status"], _count: true }),
      getSystemSettings(),
      prisma.userLoginSession.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
      prisma.user.count({ where: { status: UserStatus.LOCKED } }),
      prisma.loginAttempt.count({
        where: {
          succeeded: false,
          createdAt: { gte: new Date(Date.now() - FAILED_ATTEMPT_WINDOW_MS) },
        },
      }),
    ]);

  return {
    accountStatusBreakdown: statusRows.map((row) => ({ status: row.status, count: row._count })),
    passwordPolicy: {
      minPasswordLength: settings.minPasswordLength,
      requirePasswordUppercase: settings.requirePasswordUppercase,
      requirePasswordNumber: settings.requirePasswordNumber,
      requirePasswordSymbol: settings.requirePasswordSymbol,
    },
    activeSessionCount,
    lockedAccountCount,
    recentFailedAttemptCount,
  };
}

export async function listActiveSessions(params: ListParams): Promise<Paged<ActiveSessionItem>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const where = { revokedAt: null, expiresAt: { gt: new Date() } };

  const [rows, total] = await Promise.all([
    prisma.userLoginSession.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.userLoginSession.count({ where }),
  ]);

  const items: ActiveSessionItem[] = rows.map((row) => ({
    id: row.id,
    userName: row.user.name,
    userEmail: row.user.email,
    userAgent: row.userAgent,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
    lastSeenAt: row.lastSeenAt,
    expiresAt: row.expiresAt,
  }));

  return { items, ...paginate(total, page, pageSize) };
}

export async function listFailedLoginAttempts(
  params: ListParams,
): Promise<Paged<FailedLoginAttemptItem>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const where = { succeeded: false };

  const [rows, total] = await Promise.all([
    prisma.loginAttempt.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.loginAttempt.count({ where }),
  ]);

  const items: FailedLoginAttemptItem[] = rows.map((row) => ({
    id: row.id,
    email: row.email,
    userName: row.user?.name ?? null,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
  }));

  return { items, ...paginate(total, page, pageSize) };
}

export async function listLockedAccounts(params: ListParams): Promise<Paged<LockedAccountItem>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const where = { status: UserStatus.LOCKED };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, failedLoginAttempts: true, lockedAt: true },
      orderBy: { lockedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, ...paginate(total, page, pageSize) };
}

export async function terminateSession(sessionId: string, actor: SessionUser): Promise<void> {
  const session = await prisma.userLoginSession.findUnique({
    where: { id: sessionId },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!session) {
    throw new AdminSecurityServiceError("NOT_FOUND", "Session not found.");
  }

  await prisma.userLoginSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });

  await recordAuditEvent({
    actorId: actor.id,
    action: ActivityAction.SESSION_TERMINATED,
    entityType: "User",
    entityId: session.userId,
    targetLabel: `${session.user.name} (${session.user.email})`,
    metadata: { sessionId, ipAddress: session.ipAddress, userAgent: session.userAgent },
  });
}

export async function unlockAccount(userId: string, actor: SessionUser): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AdminSecurityServiceError("NOT_FOUND", "User not found.");
  }

  if (user.status !== UserStatus.LOCKED) {
    throw new AdminSecurityServiceError("VALIDATION_ERROR", "This account is not locked.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: UserStatus.ACTIVE, failedLoginAttempts: 0, lockedAt: null },
  });

  await recordAuditEvent({
    actorId: actor.id,
    action: ActivityAction.UNLOCKED,
    entityType: "User",
    entityId: userId,
    targetLabel: `${user.name} (${user.email})`,
  });
}
