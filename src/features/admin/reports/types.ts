export interface PlatformStats {
  totalUsers: number;
  adminCount: number;
  teacherCount: number;
  studentCount: number;
  classroomCount: number;
  assignmentCount: number;
  submissionCount: number;
  announcementCount: number;
  notificationCount: number;
}

export interface StatusBreakdownItem {
  label: string;
  count: number;
}

export interface SystemOverview {
  userStatusBreakdown: StatusBreakdownItem[];
  classroomStatusBreakdown: StatusBreakdownItem[];
  submissionStatusBreakdown: StatusBreakdownItem[];
}

export interface RecentActivityItem {
  id: string;
  action: string;
  actionLabel: string;
  entityType: string;
  actorName: string;
  classroomTitle: string | null;
  createdAt: Date;
}

export interface GrowthPoint {
  weekStart: Date;
  userSignups: number;
  classroomsCreated: number;
}

export interface ReportsData {
  stats: PlatformStats;
  overview: SystemOverview;
  recentActivity: RecentActivityItem[];
  growth: GrowthPoint[];
}
