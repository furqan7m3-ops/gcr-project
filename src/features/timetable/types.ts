import type { TimetableClashStatus } from "@/generated/prisma/enums";

export type { ActionResult } from "@/types/action-result";

export interface TimetableSlotView {
  id: string;
  classroomId: string;
  classroomTitle: string;
  section: string;
  subject: string | null;
  teacherId: string;
  teacherName: string;
  /** "YYYY-MM-DD" */
  date: string;
  startHour: number;
  /** Whether the viewer may reschedule/cancel this slot. */
  canManage: boolean;
}

export interface TimetableClassroomOption {
  id: string;
  title: string;
  section: string;
}

export type SlotHourState = "free" | "section_taken" | "teacher_busy" | "past";

export interface SlotHourAvailability {
  hour: number;
  state: SlotHourState;
  /** For taken/busy hours: which class is occupying it. */
  occupiedBy: string | null;
}

export interface TimetableClashView {
  id: string;
  status: TimetableClashStatus;
  classroomId: string;
  classroomTitle: string;
  section: string;
  requestedByName: string;
  /** The slot the blocked teacher asked for. */
  date: string;
  startHour: number;
  conflictingClassroomTitle: string | null;
  conflictingTeacherName: string | null;
  createdAt: Date;
  resolvedByName: string | null;
  resolvedAt: Date | null;
  resolvedDate: string | null;
  resolvedStartHour: number | null;
}

export type ScheduleOutcome =
  { outcome: "scheduled"; message: string } | { outcome: "clash"; message: string };
