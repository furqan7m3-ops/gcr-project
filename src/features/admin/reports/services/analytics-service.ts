import { cache } from "react";

import { statusLabels as classroomStatusLabels } from "@/features/admin/classrooms/lib/classroom-display";
import { statusLabels as userStatusLabels } from "@/features/admin/users/lib/user-display";
import { prisma } from "@/lib/prisma";
import { ClassroomStatus, UserRole } from "@/generated/prisma/enums";

import { activityActionLabels, submissionStatusLabels } from "../lib/report-display";
import type {
  GrowthPoint,
  PlatformStats,
  RecentActivityItem,
  ReportsData,
  SystemOverview,
} from "../types";

const RECENT_ACTIVITY_LIMIT = 15;
const GROWTH_WEEKS = 12;

export async function getPlatformStats(): Promise<PlatformStats> {
  const [
    roleCounts,
    classroomCount,
    assignmentCount,
    submissionCount,
    announcementCount,
    notificationCount,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.classroom.count({ where: { status: { not: ClassroomStatus.DELETED } } }),
    prisma.assignment.count({ where: { deletedAt: null } }),
    prisma.submission.count({ where: { deletedAt: null } }),
    prisma.announcement.count({ where: { deletedAt: null } }),
    prisma.notification.count({ where: { deletedAt: null } }),
  ]);

  const roleMap = new Map(roleCounts.map((row) => [row.role, row._count]));

  return {
    totalUsers: roleCounts.reduce((sum, row) => sum + row._count, 0),
    adminCount: roleMap.get(UserRole.ADMIN) ?? 0,
    teacherCount: roleMap.get(UserRole.TEACHER) ?? 0,
    studentCount: roleMap.get(UserRole.STUDENT) ?? 0,
    classroomCount,
    assignmentCount,
    submissionCount,
    announcementCount,
    notificationCount,
  };
}

export async function getSystemOverview(): Promise<SystemOverview> {
  const [userStatusRows, classroomStatusRows, submissionStatusRows] = await Promise.all([
    prisma.user.groupBy({ by: ["status"], _count: true }),
    prisma.classroom.groupBy({ by: ["status"], _count: true }),
    prisma.submission.groupBy({ by: ["status"], _count: true, where: { deletedAt: null } }),
  ]);

  return {
    userStatusBreakdown: userStatusRows
      .map((row) => ({ label: userStatusLabels[row.status], count: row._count }))
      .sort((a, b) => b.count - a.count),
    classroomStatusBreakdown: classroomStatusRows
      .map((row) => ({ label: classroomStatusLabels[row.status], count: row._count }))
      .sort((a, b) => b.count - a.count),
    submissionStatusBreakdown: submissionStatusRows
      .map((row) => ({
        label: submissionStatusLabels[row.status] ?? row.status,
        count: row._count,
      }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function getRecentActivity(
  limit = RECENT_ACTIVITY_LIMIT,
): Promise<RecentActivityItem[]> {
  // A single query with the actor/classroom relations included avoids N+1
  // lookups that a per-row fetch of the actor's name would otherwise cause.
  const logs = await prisma.activityLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      actor: { select: { name: true } },
      classroom: { select: { title: true } },
    },
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    actionLabel: activityActionLabels[log.action] ?? log.action.toLowerCase(),
    entityType: log.entityType,
    actorName: log.actor.name,
    classroomTitle: log.classroom?.title ?? null,
    createdAt: log.createdAt,
  }));
}

interface GrowthRow {
  bucket: Date;
  count: bigint;
}

function startOfIsoWeekUtc(date: Date): Date {
  const truncated = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const daysSinceMonday = (truncated.getUTCDay() + 6) % 7;
  truncated.setUTCDate(truncated.getUTCDate() - daysSinceMonday);
  return truncated;
}

export async function getPlatformGrowth(weeks = GROWTH_WEEKS): Promise<GrowthPoint[]> {
  const now = new Date();
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - weeks * 7);

  // Bucketing happens in the database via date_trunc, not by pulling every row
  // into the app and grouping in memory - a single aggregated query per model.
  const [userRows, classroomRows] = await Promise.all([
    prisma.$queryRaw<GrowthRow[]>`
      SELECT date_trunc('week', "createdAt") AS bucket, COUNT(*)::bigint AS count
      FROM "User"
      WHERE "createdAt" >= ${since}
      GROUP BY bucket
    `,
    prisma.$queryRaw<GrowthRow[]>`
      SELECT date_trunc('week', "createdAt") AS bucket, COUNT(*)::bigint AS count
      FROM "Classroom"
      WHERE "createdAt" >= ${since}
      GROUP BY bucket
    `,
  ]);

  const userCounts = new Map(
    userRows.map((row) => [startOfIsoWeekUtc(row.bucket).getTime(), Number(row.count)]),
  );
  const classroomCounts = new Map(
    classroomRows.map((row) => [startOfIsoWeekUtc(row.bucket).getTime(), Number(row.count)]),
  );

  const points: GrowthPoint[] = [];
  const cursor = startOfIsoWeekUtc(since);
  const end = startOfIsoWeekUtc(now);

  while (cursor.getTime() <= end.getTime()) {
    const key = cursor.getTime();
    points.push({
      weekStart: new Date(cursor),
      userSignups: userCounts.get(key) ?? 0,
      classroomsCreated: classroomCounts.get(key) ?? 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  return points;
}

/**
 * Memoized per-request with React's cache() - getPlatformGrowth reads
 * `new Date()` to bucket "the last 12 weeks," and this Server Action can end
 * up invoked more than once while producing a single page render (e.g. the
 * framework's dev-mode double-render-for-purity-checks). Without this, two
 * invocations landing on either side of a day/week boundary would each
 * capture a different "now" and return different weekStart values - the
 * server-rendered HTML and the payload used to hydrate it would then
 * disagree on what date to print, a real hydration mismatch, not a
 * formatting bug (see platform-growth-chart.tsx's UTC-pinned formatter,
 * which fixes a *different* now-fixed source of the same symptom).
 * cache() guarantees every call within one request returns the exact same
 * result.
 */
export const getReportsData = cache(async (): Promise<ReportsData> => {
  // Independent aggregate queries - fetched concurrently since none depends on
  // another's result.
  const [stats, overview, recentActivity, growth] = await Promise.all([
    getPlatformStats(),
    getSystemOverview(),
    getRecentActivity(),
    getPlatformGrowth(),
  ]);

  return { stats, overview, recentActivity, growth };
});
