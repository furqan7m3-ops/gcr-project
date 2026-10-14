import { redirect } from "next/navigation";

import { getCurrentUser } from "@/auth/session";
import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { UserRole } from "@/generated/prisma/enums";

import { TimetableBoard } from "@/features/timetable/components/timetable-board";
import { todayDateOnly } from "@/features/timetable/lib/slots";
import {
  listSchedulableClassrooms,
  listTimetableForUser,
} from "@/features/timetable/services/timetable-service";

export default async function TimetablePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const isTeacher = user.role === UserRole.TEACHER;
  const [slots, schedulableClassrooms] = await Promise.all([
    listTimetableForUser(user),
    isTeacher ? listSchedulableClassrooms(user) : Promise.resolve([]),
  ]);

  return (
    <PageContainer>
      <SectionHeader
        title="Timetable"
        description={
          isTeacher
            ? "Schedule one-hour classes for your sections. Students are notified automatically."
            : "Upcoming classes for your sections."
        }
      />
      <TimetableBoard
        slots={slots}
        schedulableClassrooms={schedulableClassrooms}
        canSchedule={isTeacher}
        today={todayDateOnly()}
      />
    </PageContainer>
  );
}
