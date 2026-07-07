import { UsersRound } from "lucide-react";

import { getCurrentUser } from "@/auth/session";
import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { EmptyState } from "@/components/states/empty-state";
import { UserRole } from "@/generated/prisma/enums";

import { getUserClassroomsAction } from "@/features/classroom/actions/classroom-queries";
import { ClassesPageActions } from "@/features/classroom/components/classes-page-actions";
import { ClassroomCard } from "@/features/classroom/components/classroom-card";

export default async function ClassesPage() {
  const [classrooms, user] = await Promise.all([getUserClassroomsAction(), getCurrentUser()]);
  const canCreate = user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN;

  return (
    <PageContainer>
      <SectionHeader
        title="Classes"
        description="Classes you teach or are enrolled in."
        actions={<ClassesPageActions canCreate={canCreate} />}
      />
      {classrooms.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No classes yet"
          description="Create a class or join one with a class code to get started."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((classroom) => (
            <ClassroomCard key={classroom.id} classroom={classroom} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
