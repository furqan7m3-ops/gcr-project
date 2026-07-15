import { Archive } from "lucide-react";

import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";
import { EmptyState } from "@/components/states/empty-state";

import { getArchivedClassroomsAction } from "@/features/classroom/actions/classroom-queries";
import { ClassroomCard } from "@/features/classroom/components/classroom-card";

export default async function ArchivedClassesPage() {
  const classrooms = await getArchivedClassroomsAction();

  return (
    <PageContainer>
      <SectionHeader
        title="Archived classes"
        description="Read-only classes you can still view, but not post, submit, or invite to. Restore one from its ⋮ menu to make it active again."
      />
      {classrooms.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No archived classes"
          description="Classes you archive (or that are archived by an admin) will show up here."
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
