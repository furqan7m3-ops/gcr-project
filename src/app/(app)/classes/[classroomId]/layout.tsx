import { notFound } from "next/navigation";

import { PageContainer } from "@/components/page/page-container";
import { getClassroomByIdAction } from "@/features/classroom/actions/classroom-queries";
import { ClassroomHeader } from "@/features/classroom/components/classroom-header";
import { ClassroomTabs } from "@/features/classroom/components/classroom-tabs";

export default async function ClassroomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;
  const classroom = await getClassroomByIdAction(classroomId);

  if (!classroom) {
    notFound();
  }

  return (
    <div className="flex flex-col">
      <ClassroomHeader classroom={classroom} />
      <PageContainer className="gap-4">
        <ClassroomTabs classroomId={classroom.id} />
        {children}
      </PageContainer>
    </div>
  );
}
