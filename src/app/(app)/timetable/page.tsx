import { redirect } from "next/navigation";

import { getCurrentUser } from "@/auth/session";
import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { UserRole } from "@/generated/prisma/enums";

import { TimetableBoard } from "@/features/timetable/components/timetable-board";
import { todayDayOfWeek } from "@/features/timetable/lib/slots";
import {
  listActiveRooms,
  listSchedulableClassrooms,
  listWeeklyTimetable,
} from "@/features/timetable/services/timetable-service";

export default async function TimetablePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const isTeacher = user.role === UserRole.TEACHER;
  const [slots, schedulableClassrooms, rooms] = await Promise.all([
    listWeeklyTimetable(user),
    isTeacher ? listSchedulableClassrooms(user) : Promise.resolve([]),
    isTeacher || user.role === UserRole.ADMIN ? listActiveRooms() : Promise.resolve([]),
  ]);

  return (
    <PageContainer>
      <SectionHeader
        title={user.role === UserRole.ADMIN ? "Timetable" : "My timetable"}
        description={
          isTeacher
            ? "Your weekly timetable - it repeats every week. Add a class once (day, time and room) and change it whenever you need; students are notified automatically."
            : user.role === UserRole.ADMIN
              ? "Every class on the weekly timetable."
              : "Your weekly timetable - the same every week."
        }
      />

      <TimetableBoard
        slots={slots}
        schedulableClassrooms={schedulableClassrooms}
        canSchedule={isTeacher}
        showTeacher={!isTeacher}
        rooms={rooms}
        today={todayDayOfWeek()}
      />
    </PageContainer>
  );
}
