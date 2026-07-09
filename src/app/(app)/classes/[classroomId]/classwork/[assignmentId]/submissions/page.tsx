import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/page/section-header";
import { getAssignmentDetail } from "@/features/classwork/queries/assignment-queries";
import { SubmissionList } from "@/features/submissions/components/submission-list";
import { getAssignmentSubmissions } from "@/features/submissions/queries/submission-queries";

export default async function SubmissionsListPage({
  params,
}: {
  params: Promise<{ classroomId: string; assignmentId: string }>;
}) {
  const { classroomId, assignmentId } = await params;

  const assignment = await getAssignmentDetail(classroomId, assignmentId);

  if (!assignment || !assignment.canManage) {
    notFound();
  }

  const overview = await getAssignmentSubmissions(classroomId, assignmentId);

  if (!overview) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Submissions"
        breadcrumbs={[
          { label: "Classwork", href: `/classes/${classroomId}/classwork` },
          { label: assignment.title, href: `/classes/${classroomId}/classwork/${assignmentId}` },
          { label: "Submissions" },
        ]}
      />
      <SubmissionList classroomId={classroomId} assignmentId={assignmentId} overview={overview} />
    </div>
  );
}
