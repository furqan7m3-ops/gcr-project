import type { ClassroomSummary } from "@/features/classroom/types";
import type { PlatformStats, RecentActivityItem } from "@/features/admin/reports/types";
import type { ReviewQueueSummary } from "@/features/review/types";
import type { ScheduledContentStats, UpcomingPublicationItem } from "@/features/scheduling/types";

export type { UpcomingPublicationItem } from "@/features/scheduling/types";

export interface UpcomingDeadlineItem {
  id: string;
  title: string;
  classroomId: string;
  classroomTitle: string;
  dueDate: Date;
}

export interface TeacherDashboardData {
  activeClassroomCount: number;
  archivedClassroomCount: number;
  scheduledContent: ScheduledContentStats;
  reviewSummary: ReviewQueueSummary;
  upcomingPublications: UpcomingPublicationItem[];
}

export interface StudentDashboardData {
  activeClassroomCount: number;
  archivedClassrooms: ClassroomSummary[];
  upcomingDeadlines: UpcomingDeadlineItem[];
}

export interface AdminDashboardData {
  platformStats: PlatformStats;
  archivedClassroomCount: number;
  scheduledContent: ScheduledContentStats;
  recentActivity: RecentActivityItem[];
}
