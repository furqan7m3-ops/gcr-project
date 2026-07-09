import { notFound } from "next/navigation";

import { SectionHeader } from "@/components/page/section-header";
import { getAssignmentDetail } from "@/features/classwork/queries/assignment-queries";
import { SubmissionReviewPanel } from "@/features/submissions/components/submission-review-panel";
import { getSubmissionDetails } from "@/features/submissions/queries/submission-queries";

export default async function SubmissionReviewPage({
  params,
}: {
  params: Promise<{ classroomId: string; assignmentId: string; studentId: string }>;
}) {
  const { classroomId, assignmentId, studentId } = await params;

  const assignment = await getAssignmentDetail(classroomId, assignmentId);

  if (!assignment || !assignment.canManage) {
    notFound();
  }

  const detail = await getSubmissionDetails(classroomId, assignmentId, studentId);

  if (!detail) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title={detail.student.name}
        breadcrumbs={[
          { label: "Classwork", href: `/classes/${classroomId}/classwork` },
          { label: assignment.title, href: `/classes/${classroomId}/classwork/${assignmentId}` },
          {
            label: "Submissions",
            href: `/classes/${classroomId}/classwork/${assignmentId}/submissions`,
          },
          { label: detail.student.name },
        ]}
      />
      <SubmissionReviewPanel
        classroomId={classroomId}
        assignmentId={assignmentId}
        studentId={studentId}
        dueDate={assignment.dueDate}
        maxPoints={assignment.points}
        initialDetail={detail}
      />
    </div>
  );
}
