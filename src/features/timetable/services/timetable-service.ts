import type { SessionUser } from "@/auth/session";
import {
  assertClassroomActive,
  assertManagementAccess,
  loadActiveClassroom,
} from "@/features/classroom/services/classroom-service";
import {
  notifyTimeslotCancelled,
  notifyTimeslotClash,
  notifyTimeslotResolved,
  notifyTimeslotScheduled,
  notifyTimeslotUpdated,
} from "@/features/notifications/services/notification-generator";
import { Prisma } from "@/generated/prisma/client";
import {
  ActivityAction,
  ClassroomMembershipRole,
  ClassroomMembershipStatus,
  ClassroomStatus,
  TimetableClashStatus,
  UserRole,
} from "@/generated/prisma/enums";
import { recordAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

import { TimetableServiceError } from "../lib/errors";
import {
  SLOT_START_HOURS,
  UNASSIGNED_SECTION,
  formatDateOnly,
  formatSlot,
  isSlotInPast,
  isSunday,
  isValidSlotHour,
  parseDateOnly,
  todayDateOnly,
  toSectionKey,
} from "../lib/slots";
import type {
  ScheduleOutcome,
  SlotHourAvailability,
  TimetableClashView,
  TimetableClassroomOption,
  TimetableSlotView,
} from "../types";

const MANAGER_ROLES = [
  ClassroomMembershipRole.OWNER,
  ClassroomMembershipRole.TEACHER,
  ClassroomMembershipRole.CO_TEACHER,
];

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** Validates a requested date + hour and returns the parsed date. Throws a user-facing error otherwise. */
function parseAndValidateSlot(dateValue: string, startHour: number): Date {
  const date = parseDateOnly(dateValue);
  if (!date) {
    throw new TimetableServiceError("VALIDATION_ERROR", "Pick a valid date.");
  }
  if (!isValidSlotHour(startHour)) {
    throw new TimetableServiceError(
      "VALIDATION_ERROR",
      "Classes run between 8:00 AM and 5:00 PM in one-hour slots.",
    );
  }
  if (isSunday(date)) {
    throw new TimetableServiceError("VALIDATION_ERROR", "Classes run Monday to Saturday.");
  }
  if (isSlotInPast(date, startHour)) {
    throw new TimetableServiceError("VALIDATION_ERROR", "You can't schedule a class in the past.");
  }
  return date;
}

function assertSectionAssigned(section: string): string {
  const key = toSectionKey(section);
  if (!key || key === toSectionKey(UNASSIGNED_SECTION)) {
    throw new TimetableServiceError(
      "SECTION_NOT_SET",
      "This class has no section yet. Edit the class and set its section before scheduling.",
    );
  }
  return key;
}

function slotLabelOf(slot: { slotDate: Date; startHour: number }): string {
  return formatSlot(slot.slotDate, slot.startHour);
}

const slotWithDetailsInclude = {
  classroom: { select: { id: true, title: true, section: true, subject: true } },
  teacher: { select: { id: true, name: true } },
} as const;

type SlotWithDetails = Prisma.TimetableSlotGetPayload<{ include: typeof slotWithDetailsInclude }>;

function toSlotView(slot: SlotWithDetails, canManage: boolean): TimetableSlotView {
  return {
    id: slot.id,
    classroomId: slot.classroomId,
    classroomTitle: slot.classroom.title,
    section: slot.classroom.section,
    subject: slot.classroom.subject,
    teacherId: slot.teacherId,
    teacherName: slot.teacher.name,
    date: formatDateOnly(slot.slotDate),
    startHour: slot.startHour,
    canManage,
  };
}

/** Finds whatever currently occupies the section / teacher at a slot, ignoring `excludeSlotId`. */
async function findOccupants(params: {
  sectionKey: string;
  teacherId: string;
  slotDate: Date;
  startHour: number;
  excludeSlotId?: string;
}) {
  const [sectionSlot, teacherSlot] = await Promise.all([
    prisma.timetableSlot.findUnique({
      where: {
        sectionKey_slotDate_startHour: {
          sectionKey: params.sectionKey,
          slotDate: params.slotDate,
          startHour: params.startHour,
        },
      },
      include: slotWithDetailsInclude,
    }),
    prisma.timetableSlot.findUnique({
      where: {
        teacherId_slotDate_startHour: {
          teacherId: params.teacherId,
          slotDate: params.slotDate,
          startHour: params.startHour,
        },
      },
      include: slotWithDetailsInclude,
    }),
  ]);

  return {
    sectionSlot: sectionSlot && sectionSlot.id !== params.excludeSlotId ? sectionSlot : null,
    teacherSlot: teacherSlot && teacherSlot.id !== params.excludeSlotId ? teacherSlot : null,
  };
}

function teacherBusyError(slot: SlotWithDetails): TimetableServiceError {
  return new TimetableServiceError(
    "TEACHER_BUSY",
    `You already teach ${slot.classroom.title} (Section ${slot.classroom.section}) at that time. Pick a different slot.`,
  );
}

function sectionTakenError(sectionLabel: string): TimetableServiceError {
  return new TimetableServiceError(
    "SLOT_TAKEN",
    `Section ${sectionLabel} already has a class in that slot. Pick a different slot.`,
  );
}

/**
 * A teacher books a one-hour slot for one of their classes.
 *
 * - Free slot: it's saved and the classroom's students are notified.
 * - Section already has a class then: nothing is booked. A clash record is
 *   opened (once per class/slot) and the admins are notified, so an admin can
 *   move the blocked class to a free slot. The existing booking is untouched.
 * - Teacher already teaching elsewhere then: rejected outright.
 */
export async function scheduleSlot(
  user: SessionUser,
  input: { classroomId: string; date: string; startHour: number },
): Promise<ScheduleOutcome> {
  const classroom = await loadActiveClassroom(input.classroomId);
  assertClassroomActive(classroom, "This class is archived - restore it before scheduling.");
  await assertManagementAccess(input.classroomId, user);

  const sectionKey = assertSectionAssigned(classroom.section);
  const slotDate = parseAndValidateSlot(input.date, input.startHour);

  // Two attempts: the second only runs if a concurrent booking won the race for
  // the same slot between our check and our insert (unique constraint -> P2002),
  // in which case the re-check below turns the lost race into a regular clash.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { sectionSlot, teacherSlot } = await findOccupants({
      sectionKey,
      teacherId: user.id,
      slotDate,
      startHour: input.startHour,
    });

    if (sectionSlot) {
      if (sectionSlot.classroomId === classroom.id) {
        throw new TimetableServiceError(
          "ALREADY_SCHEDULED",
          "This class is already scheduled for that slot.",
        );
      }
      return openClash({
        user,
        classroom,
        sectionKey,
        slotDate,
        startHour: input.startHour,
        conflictingSlot: sectionSlot,
      });
    }

    if (teacherSlot) {
      throw teacherBusyError(teacherSlot);
    }

    try {
      await prisma.timetableSlot.create({
        data: {
          classroomId: classroom.id,
          teacherId: user.id,
          sectionKey,
          slotDate,
          startHour: input.startHour,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error) && attempt === 0) {
        continue;
      }
      if (isUniqueConstraintError(error)) {
        throw sectionTakenError(classroom.section);
      }
      throw error;
    }

    const label = formatSlot(slotDate, input.startHour);
    await notifyTimeslotScheduled({
      classroomId: classroom.id,
      classroomTitle: classroom.title,
      teacherId: user.id,
      slotLabel: label,
    });

    return { outcome: "scheduled", message: `${classroom.title} scheduled for ${label}.` };
  }

  throw sectionTakenError(classroom.section);
}

async function openClash(params: {
  user: SessionUser;
  classroom: { id: string; title: string; section: string };
  sectionKey: string;
  slotDate: Date;
  startHour: number;
  conflictingSlot: SlotWithDetails;
}): Promise<ScheduleOutcome> {
  const { user, classroom, conflictingSlot } = params;
  const label = formatSlot(params.slotDate, params.startHour);

  // Re-submitting the same blocked request shouldn't spam admins with duplicates.
  const existing = await prisma.timetableClash.findFirst({
    where: {
      classroomId: classroom.id,
      slotDate: params.slotDate,
      startHour: params.startHour,
      status: TimetableClashStatus.PENDING,
    },
    select: { id: true },
  });

  if (!existing) {
    const clash = await prisma.timetableClash.create({
      data: {
        classroomId: classroom.id,
        requestedById: user.id,
        conflictingSlotId: conflictingSlot.id,
        sectionKey: params.sectionKey,
        slotDate: params.slotDate,
        startHour: params.startHour,
      },
    });

    await notifyTimeslotClash({
      clashId: clash.id,
      classroomTitle: classroom.title,
      section: classroom.section,
      teacherName: user.name ?? "A teacher",
      slotLabel: label,
      conflictingClassroomTitle: conflictingSlot.classroom.title,
    });
  }

  return {
    outcome: "clash",
    message: `Section ${classroom.section} already has ${conflictingSlot.classroom.title} on ${label}. Your class was not booked - the admin has been notified and will move it to another slot.`,
  };
}

async function loadManageableSlot(user: SessionUser, slotId: string) {
  const slot = await prisma.timetableSlot.findUnique({
    where: { id: slotId },
    include: slotWithDetailsInclude,
  });

  if (!slot) {
    throw new TimetableServiceError("NOT_FOUND", "That timetable slot no longer exists.");
  }

  if (user.role !== UserRole.ADMIN && slot.teacherId !== user.id) {
    throw new TimetableServiceError("FORBIDDEN", "You can only change your own timetable slots.");
  }

  return slot;
}

/** Moves a teacher's own slot. Conflicts are rejected (no clash record) - pick another slot. */
export async function rescheduleSlot(
  user: SessionUser,
  input: { slotId: string; date: string; startHour: number },
): Promise<ScheduleOutcome> {
  const slot = await loadManageableSlot(user, input.slotId);
  const classroom = await loadActiveClassroom(slot.classroomId);
  assertClassroomActive(classroom, "This class is archived - restore it before rescheduling.");
  if (user.role !== UserRole.ADMIN) {
    await assertManagementAccess(slot.classroomId, user);
  }

  const sectionKey = assertSectionAssigned(classroom.section);
  const slotDate = parseAndValidateSlot(input.date, input.startHour);

  if (
    formatDateOnly(slotDate) === formatDateOnly(slot.slotDate) &&
    input.startHour === slot.startHour
  ) {
    throw new TimetableServiceError("VALIDATION_ERROR", "That's already this class's slot.");
  }

  const { sectionSlot, teacherSlot } = await findOccupants({
    sectionKey,
    teacherId: slot.teacherId,
    slotDate,
    startHour: input.startHour,
    excludeSlotId: slot.id,
  });

  if (sectionSlot) {
    throw sectionTakenError(classroom.section);
  }
  if (teacherSlot) {
    throw teacherBusyError(teacherSlot);
  }

  try {
    await prisma.timetableSlot.update({
      where: { id: slot.id },
      data: { slotDate, startHour: input.startHour, sectionKey },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw sectionTakenError(classroom.section);
    }
    throw error;
  }

  const newLabel = formatSlot(slotDate, input.startHour);
  await notifyTimeslotUpdated({
    classroomId: classroom.id,
    classroomTitle: classroom.title,
    teacherId: slot.teacherId,
    oldSlotLabel: slotLabelOf(slot),
    newSlotLabel: newLabel,
  });

  return { outcome: "scheduled", message: `${classroom.title} moved to ${newLabel}.` };
}

export async function cancelSlot(user: SessionUser, slotId: string): Promise<void> {
  const slot = await loadManageableSlot(user, slotId);

  await prisma.timetableSlot.delete({ where: { id: slot.id } });

  // A slot that has already passed is just history being tidied up - nobody
  // needs to be told it's "cancelled".
  if (!isSlotInPast(slot.slotDate, slot.startHour)) {
    await notifyTimeslotCancelled({
      classroomId: slot.classroomId,
      classroomTitle: slot.classroom.title,
      teacherId: slot.teacherId,
      slotLabel: slotLabelOf(slot),
    });
  }
}

/**
 * Which hours of `dateValue` are free for this class: not held by another class
 * in the same section, not clashing with the teacher's other classes, and not
 * already in the past. Pure information for the UI - the real guarantee is the
 * check + unique constraints in scheduleSlot / rescheduleSlot / resolveClash.
 */
async function computeAvailability(params: {
  sectionKey: string;
  teacherId: string;
  dateValue: string;
  excludeSlotId?: string;
}): Promise<SlotHourAvailability[]> {
  const date = parseDateOnly(params.dateValue);
  if (!date) {
    throw new TimetableServiceError("VALIDATION_ERROR", "Pick a valid date.");
  }

  const [sectionSlots, teacherSlots] = await Promise.all([
    prisma.timetableSlot.findMany({
      where: { sectionKey: params.sectionKey, slotDate: date },
      include: slotWithDetailsInclude,
    }),
    prisma.timetableSlot.findMany({
      where: { teacherId: params.teacherId, slotDate: date },
      include: slotWithDetailsInclude,
    }),
  ]);

  const sundayBlock = isSunday(date);

  return SLOT_START_HOURS.map((hour): SlotHourAvailability => {
    if (sundayBlock || isSlotInPast(date, hour)) {
      return { hour, state: "past", occupiedBy: null };
    }

    const sectionSlot = sectionSlots.find(
      (slot) => slot.startHour === hour && slot.id !== params.excludeSlotId,
    );
    if (sectionSlot) {
      return { hour, state: "section_taken", occupiedBy: sectionSlot.classroom.title };
    }

    const teacherSlot = teacherSlots.find(
      (slot) => slot.startHour === hour && slot.id !== params.excludeSlotId,
    );
    if (teacherSlot) {
      return { hour, state: "teacher_busy", occupiedBy: teacherSlot.classroom.title };
    }

    return { hour, state: "free", occupiedBy: null };
  });
}

export async function getSlotAvailability(
  user: SessionUser,
  input: { classroomId: string; date: string; excludeSlotId?: string },
): Promise<SlotHourAvailability[]> {
  const classroom = await loadActiveClassroom(input.classroomId);
  await assertManagementAccess(input.classroomId, user);

  return computeAvailability({
    sectionKey: toSectionKey(classroom.section),
    teacherId: user.id,
    dateValue: input.date,
    excludeSlotId: input.excludeSlotId,
  });
}

/** Active classrooms the teacher manages and can schedule (section already set). */
export async function listSchedulableClassrooms(
  user: SessionUser,
): Promise<TimetableClassroomOption[]> {
  const memberships = await prisma.classroomMembership.findMany({
    where: {
      userId: user.id,
      status: ClassroomMembershipStatus.ACTIVE,
      role: { in: MANAGER_ROLES },
      classroom: { status: ClassroomStatus.ACTIVE },
    },
    select: { classroom: { select: { id: true, title: true, section: true } } },
    orderBy: { classroom: { title: "asc" } },
  });

  return memberships
    .map((membership) => membership.classroom)
    .filter((classroom) => toSectionKey(classroom.section) !== toSectionKey(UNASSIGNED_SECTION));
}

/**
 * Upcoming timetable for the viewer, starting today:
 *  - student: slots of the classes they're an active member of (view only)
 *  - teacher: slots of every class they manage (can change only their own)
 *  - admin: every slot
 */
export async function listTimetableForUser(user: SessionUser): Promise<TimetableSlotView[]> {
  const from = parseDateOnly(todayDateOnly()) as Date;

  let classroomFilter: Prisma.TimetableSlotWhereInput;
  if (user.role === UserRole.ADMIN) {
    classroomFilter = {};
  } else {
    const memberships = await prisma.classroomMembership.findMany({
      where: { userId: user.id, status: ClassroomMembershipStatus.ACTIVE },
      select: { classroomId: true },
    });
    classroomFilter = { classroomId: { in: memberships.map((m) => m.classroomId) } };
  }

  const slots = await prisma.timetableSlot.findMany({
    where: {
      ...classroomFilter,
      slotDate: { gte: from },
      classroom: { status: { not: ClassroomStatus.DELETED } },
    },
    include: slotWithDetailsInclude,
    orderBy: [{ slotDate: "asc" }, { startHour: "asc" }],
    take: 500,
  });

  return slots.map((slot) =>
    toSlotView(slot, user.role === UserRole.ADMIN || slot.teacherId === user.id),
  );
}

// ---------------------------------------------------------------------------
// Admin: clash review
// ---------------------------------------------------------------------------

const clashDetailsInclude = {
  classroom: { select: { id: true, title: true, section: true } },
  requestedBy: { select: { id: true, name: true } },
  resolvedBy: { select: { name: true } },
  conflictingSlot: {
    select: {
      classroom: { select: { title: true } },
      teacher: { select: { id: true, name: true } },
    },
  },
  resolvedSlot: { select: { slotDate: true, startHour: true } },
} as const;

type ClashWithDetails = Prisma.TimetableClashGetPayload<{ include: typeof clashDetailsInclude }>;

function toClashView(clash: ClashWithDetails): TimetableClashView {
  return {
    id: clash.id,
    status: clash.status,
    classroomId: clash.classroomId,
    classroomTitle: clash.classroom.title,
    section: clash.classroom.section,
    requestedByName: clash.requestedBy.name,
    date: formatDateOnly(clash.slotDate),
    startHour: clash.startHour,
    conflictingClassroomTitle: clash.conflictingSlot?.classroom.title ?? null,
    conflictingTeacherName: clash.conflictingSlot?.teacher.name ?? null,
    createdAt: clash.createdAt,
    resolvedByName: clash.resolvedBy?.name ?? null,
    resolvedAt: clash.resolvedAt,
    resolvedDate: clash.resolvedSlot ? formatDateOnly(clash.resolvedSlot.slotDate) : null,
    resolvedStartHour: clash.resolvedSlot?.startHour ?? null,
  };
}

export async function listClashes(filter: "pending" | "all"): Promise<TimetableClashView[]> {
  const clashes = await prisma.timetableClash.findMany({
    where: filter === "pending" ? { status: TimetableClashStatus.PENDING } : {},
    include: clashDetailsInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return clashes.map(toClashView);
}

async function loadPendingClash(clashId: string) {
  const clash = await prisma.timetableClash.findUnique({
    where: { id: clashId },
    include: clashDetailsInclude,
  });

  if (!clash) {
    throw new TimetableServiceError("NOT_FOUND", "That clash no longer exists.");
  }
  if (clash.status !== TimetableClashStatus.PENDING) {
    throw new TimetableServiceError("CLASH_NOT_PENDING", "This clash has already been handled.");
  }

  return clash;
}

/** Availability of a given date for the *blocked* class in a clash - drives the admin's slot picker. */
export async function getClashAvailability(
  clashId: string,
  dateValue: string,
): Promise<SlotHourAvailability[]> {
  const clash = await loadPendingClash(clashId);

  return computeAvailability({
    sectionKey: toSectionKey(clash.classroom.section),
    teacherId: clash.requestedById,
    dateValue,
  });
}

/**
 * Admin resolves a clash by moving the blocked class to a free slot. The
 * blocked teacher's class is booked there (the section's existing class is
 * never displaced), the clash is closed, and then:
 *  - the blocked teacher is told which slot their class was moved to,
 *  - the teacher who already held the contested slot is told the clash is
 *    settled and where the other class went,
 *  - the blocked class's students are told when their class is scheduled.
 */
export async function resolveClash(
  admin: SessionUser,
  input: { clashId: string; date: string; startHour: number },
): Promise<void> {
  const clash = await loadPendingClash(input.clashId);
  const classroom = await loadActiveClassroom(clash.classroomId);
  assertClassroomActive(classroom, "This class is archived - restore it before scheduling.");

  const sectionKey = assertSectionAssigned(classroom.section);
  const slotDate = parseAndValidateSlot(input.date, input.startHour);

  const { sectionSlot, teacherSlot } = await findOccupants({
    sectionKey,
    teacherId: clash.requestedById,
    slotDate,
    startHour: input.startHour,
  });
  if (sectionSlot) {
    throw sectionTakenError(classroom.section);
  }
  if (teacherSlot) {
    throw new TimetableServiceError(
      "TEACHER_BUSY",
      `${clash.requestedBy.name} already teaches ${teacherSlot.classroom.title} at that time. Pick a different slot.`,
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const created = await tx.timetableSlot.create({
        data: {
          classroomId: classroom.id,
          teacherId: clash.requestedById,
          sectionKey,
          slotDate,
          startHour: input.startHour,
        },
      });

      // Guarded on PENDING so two admins resolving the same clash can't both win.
      const closed = await tx.timetableClash.updateMany({
        where: { id: clash.id, status: TimetableClashStatus.PENDING },
        data: {
          status: TimetableClashStatus.RESOLVED,
          resolvedById: admin.id,
          resolvedSlotId: created.id,
          resolvedAt: new Date(),
        },
      });
      if (closed.count !== 1) {
        throw new TimetableServiceError(
          "CLASH_NOT_PENDING",
          "This clash has already been handled.",
        );
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw sectionTakenError(classroom.section);
    }
    throw error;
  }

  const requestedLabel = formatSlot(clash.slotDate, clash.startHour);
  const newLabel = formatSlot(slotDate, input.startHour);

  await recordAuditEvent({
    actorId: admin.id,
    action: ActivityAction.UPDATED,
    entityType: "TimetableClash",
    entityId: clash.id,
    targetLabel: `${classroom.title} (Section ${classroom.section}): ${requestedLabel} -> ${newLabel}`,
    classroomId: classroom.id,
  }).catch((error) => console.error("Failed to record timetable clash audit event:", error));

  await notifyTimeslotResolved({
    teacherIds: [clash.requestedById],
    message: `The clash for ${classroom.title} (Section ${classroom.section}) on ${requestedLabel} was resolved by the admin. Your class has been moved to ${newLabel}.`,
  });

  const holder = clash.conflictingSlot?.teacher;
  if (holder && holder.id !== clash.requestedById) {
    await notifyTimeslotResolved({
      teacherIds: [holder.id],
      message: `The clash on ${requestedLabel} for Section ${classroom.section} was resolved by the admin. ${classroom.title} was moved to ${newLabel}; ${clash.conflictingSlot?.classroom.title ?? "your class"} keeps its slot.`,
    });
  }

  await notifyTimeslotScheduled({
    classroomId: classroom.id,
    classroomTitle: classroom.title,
    teacherId: clash.requestedById,
    slotLabel: newLabel,
    scheduledByAdmin: true,
  });
}

/** Closes a clash without scheduling anything (e.g. the teacher already picked another slot). */
export async function dismissClash(admin: SessionUser, clashId: string): Promise<void> {
  const clash = await loadPendingClash(clashId);

  await prisma.timetableClash.update({
    where: { id: clash.id },
    data: {
      status: TimetableClashStatus.DISMISSED,
      resolvedById: admin.id,
      resolvedAt: new Date(),
    },
  });
}
