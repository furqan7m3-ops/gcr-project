"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePendingAction } from "@/hooks/use-pending-action";
import { getInitials } from "@/lib/utils";

import { returnSubmissionAction } from "../actions/submission-mutations";
import { toDisplayStatus } from "../lib/display-status";
import type { SubmissionReviewDetail } from "../types";
import { PrivateCommentPanel } from "./private-comment-panel";
import { SubmissionAttachmentList } from "./submission-attachment-list";
import { SubmissionStatusBadge } from "./submission-status-badge";

function formatDateTime(date: Date | null): string | null {
  if (!date) {
    return null;
  }

  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

interface SubmissionReviewPanelProps {
  classroomId: string;
  assignmentId: string;
  studentId: string;
  dueDate: Date | null;
  initialDetail: SubmissionReviewDetail;
}

export function SubmissionReviewPanel({
  classroomId,
  assignmentId,
  studentId,
  dueDate,
  initialDetail,
}: SubmissionReviewPanelProps) {
  const router = useRouter();
  const [detail, setDetail] = useState(initialDetail);
  const [returnConfirmOpen, setReturnConfirmOpen] = useState(false);

  const returnSubmission = usePendingAction(
    () => returnSubmissionAction(classroomId, assignmentId, studentId),
    (data) => {
      setDetail(data);
      setReturnConfirmOpen(false);
      toast.success("Submission returned");
      router.refresh();
    },
  );

  const dueDateLabel = formatDateTime(dueDate);
  const submittedAtLabel = formatDateTime(detail.submission?.submittedAt ?? null);
  const updatedAtLabel = formatDateTime(detail.submission?.updatedAt ?? null);
  const returnedAtLabel = formatDateTime(detail.submission?.returnedAt ?? null);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9">
              {detail.student.image ? (
                <AvatarImage src={detail.student.image} alt={detail.student.name} />
              ) : null}
              <AvatarFallback>{getInitials(detail.student.name)}</AvatarFallback>
            </Avatar>
            <CardTitle>{detail.student.name}</CardTitle>
          </div>
          <SubmissionStatusBadge status={toDisplayStatus(detail.submission?.status ?? null)} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {dueDateLabel ? (
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                Due {dueDateLabel}
              </span>
            ) : null}
            {returnedAtLabel ? <span>Returned {returnedAtLabel}</span> : null}
            {submittedAtLabel ? <span>Submitted {submittedAtLabel}</span> : null}
            {updatedAtLabel && !submittedAtLabel ? (
              <span>Last updated {updatedAtLabel}</span>
            ) : null}
          </div>

          {detail.submission ? (
            <>
              {detail.submission.textAnswer ? (
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {detail.submission.textAnswer}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No text response.</p>
              )}

              <SubmissionAttachmentList
                attachments={detail.submission.attachments}
                pendingFiles={[]}
                editable={false}
              />

              {detail.canReturn ? (
                <Button
                  type="button"
                  className="w-fit"
                  onClick={() => setReturnConfirmOpen(true)}
                  disabled={returnSubmission.isPending}
                >
                  {returnSubmission.isPending ? "Returning…" : "Return"}
                </Button>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              This student hasn&apos;t started their submission yet.
            </p>
          )}
        </CardContent>

        <ConfirmDialog
          open={returnConfirmOpen}
          onOpenChange={setReturnConfirmOpen}
          title="Return this submission?"
          description={`${detail.student.name} will see their work marked as returned. This doesn't assign a grade.`}
          confirmLabel="Return"
          pending={returnSubmission.isPending}
          onConfirm={returnSubmission.run}
        />
      </Card>

      <PrivateCommentPanel
        classroomId={classroomId}
        assignmentId={assignmentId}
        studentId={studentId}
        initialComments={detail.comments}
        canComment={detail.submission !== null}
        visibilityNote={`Only visible to you and ${detail.student.name}.`}
        disabledNote="This student hasn't started their submission yet, so there's nothing to comment on."
      />
    </div>
  );
}
