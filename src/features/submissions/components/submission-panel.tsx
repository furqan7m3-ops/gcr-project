"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Paperclip } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePendingAction } from "@/hooks/use-pending-action";

import {
  removeSubmissionAttachmentAction,
  saveSubmissionDraftAction,
  submitAssignmentAction,
  unsubmitAssignmentAction,
} from "../actions/submission-mutations";
import { toDisplayStatus } from "../lib/display-status";
import type { PrivateCommentSummary, SubmissionView } from "../types";
import { PrivateCommentPanel } from "./private-comment-panel";
import { SubmissionAttachmentList } from "./submission-attachment-list";
import { SubmissionStatusBadge } from "./submission-status-badge";

function formatDateTime(date: Date | null): string | null {
  if (!date) {
    return null;
  }

  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

interface SubmissionPanelProps {
  classroomId: string;
  assignmentId: string;
  studentId: string;
  dueDate: Date | null;
  initialView: SubmissionView;
  initialComments: PrivateCommentSummary[];
}

export function SubmissionPanel({
  classroomId,
  assignmentId,
  studentId,
  dueDate,
  initialView,
  initialComments,
}: SubmissionPanelProps) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  const [textValue, setTextValue] = useState(view.submission?.textAnswer ?? "");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [unsubmitConfirmOpen, setUnsubmitConfirmOpen] = useState(false);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<string | null>(null);
  const [isRemovingAttachment, startRemoveTransition] = useTransition();

  function buildFormData(): FormData {
    const formData = new FormData();
    formData.set("classroomId", classroomId);
    formData.set("assignmentId", assignmentId);
    formData.set("textAnswer", textValue);
    for (const file of pendingFiles) {
      formData.append("files", file);
    }
    return formData;
  }

  function applyView(next: SubmissionView) {
    setView(next);
    setTextValue(next.submission?.textAnswer ?? "");
    setPendingFiles([]);
    router.refresh();
  }

  const saveDraft = usePendingAction(
    () => saveSubmissionDraftAction(buildFormData()),
    (data) => {
      applyView(data);
      toast.success("Draft saved");
    },
  );

  const submit = usePendingAction(
    () => submitAssignmentAction(buildFormData()),
    (data) => {
      applyView(data);
      setSubmitConfirmOpen(false);
      toast.success("Assignment turned in");
    },
  );

  const unsubmit = usePendingAction(
    () => unsubmitAssignmentAction(classroomId, assignmentId),
    (data) => {
      applyView(data);
      setUnsubmitConfirmOpen(false);
      toast.success("Unsubmitted - you can make changes again");
    },
  );

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      setPendingFiles((previous) => [...previous, ...files]);
    }
    event.target.value = "";
  }

  function handleRemovePendingFile(index: number) {
    setPendingFiles((previous) => previous.filter((_, i) => i !== index));
  }

  function handleRemoveAttachment(fileAttachmentId: string) {
    if (!view.submission) {
      return;
    }

    const submissionId = view.submission.id;
    setRemovingAttachmentId(fileAttachmentId);

    startRemoveTransition(async () => {
      const result = await removeSubmissionAttachmentAction(
        classroomId,
        assignmentId,
        submissionId,
        fileAttachmentId,
      );

      if (result.status === "success") {
        setView((previous) =>
          previous.submission
            ? {
                ...previous,
                submission: {
                  ...previous.submission,
                  attachments: previous.submission.attachments.filter(
                    (attachment) => attachment.id !== fileAttachmentId,
                  ),
                },
              }
            : previous,
        );
        toast.success("Attachment removed");
        router.refresh();
      } else {
        toast.error(result.message);
      }

      setRemovingAttachmentId(null);
    });
  }

  const isBusy = saveDraft.isPending || submit.isPending;
  const dueDateLabel = formatDateTime(dueDate);
  const updatedAtLabel = formatDateTime(view.submission?.updatedAt ?? null);
  const submittedAtLabel = formatDateTime(view.submission?.submittedAt ?? null);
  const returnedAtLabel = formatDateTime(view.submission?.returnedAt ?? null);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle>Your work</CardTitle>
          <SubmissionStatusBadge status={toDisplayStatus(view.submission?.status ?? null)} />
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

          {view.canEdit ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="submission-text">Your response</Label>
                <Textarea
                  id="submission-text"
                  value={textValue}
                  onChange={(event) => setTextValue(event.target.value)}
                  rows={6}
                  maxLength={20_000}
                  placeholder="Type your response..."
                  disabled={isBusy}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="submission-files">Attachments</Label>
                <SubmissionAttachmentList
                  attachments={view.submission?.attachments ?? []}
                  pendingFiles={pendingFiles}
                  editable
                  removingAttachmentId={isRemovingAttachment ? removingAttachmentId : null}
                  onRemoveAttachment={handleRemoveAttachment}
                  onRemovePendingFile={handleRemovePendingFile}
                />
                <input
                  id="submission-files"
                  type="file"
                  multiple
                  onChange={handleFilesSelected}
                  disabled={isBusy}
                  className="text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  File names are recorded now; storing file contents isn&apos;t wired up yet.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={saveDraft.run} disabled={isBusy}>
                  {saveDraft.isPending ? "Saving…" : "Save draft"}
                </Button>
                <Button type="button" onClick={() => setSubmitConfirmOpen(true)} disabled={isBusy}>
                  Turn in
                </Button>
              </div>
            </>
          ) : (
            <>
              {view.submission?.textAnswer ? (
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {view.submission.textAnswer}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No text response.</p>
              )}

              {view.submission && view.submission.attachments.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {view.submission.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-1.5 text-sm text-foreground"
                    >
                      <Paperclip
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="truncate">{attachment.fileName}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {view.canUnsubmit ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUnsubmitConfirmOpen(true)}
                  disabled={unsubmit.isPending}
                >
                  {unsubmit.isPending ? "Unsubmitting…" : "Unsubmit"}
                </Button>
              ) : null}
            </>
          )}
        </CardContent>

        <ConfirmDialog
          open={submitConfirmOpen}
          onOpenChange={setSubmitConfirmOpen}
          title="Turn in this assignment?"
          description="Your teacher will be able to see your response and attachments. You can unsubmit later to make changes, as long as the due date hasn't passed and the assignment isn't closed."
          confirmLabel="Turn in"
          pending={submit.isPending}
          onConfirm={submit.run}
        />

        <ConfirmDialog
          open={unsubmitConfirmOpen}
          onOpenChange={setUnsubmitConfirmOpen}
          title="Unsubmit this assignment?"
          description="Your work will go back to draft so you can make changes. Remember to turn it in again before the due date."
          confirmLabel="Unsubmit"
          pending={unsubmit.isPending}
          onConfirm={unsubmit.run}
        />
      </Card>

      <PrivateCommentPanel
        classroomId={classroomId}
        assignmentId={assignmentId}
        studentId={studentId}
        initialComments={initialComments}
        canComment={view.submission !== null}
        visibilityNote="Only visible to you and your teacher."
        disabledNote="Save a draft first to start a private conversation with your teacher."
      />
    </div>
  );
}
