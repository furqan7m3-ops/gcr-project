"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PublishControls,
  type PublishMode,
} from "@/features/scheduling/components/publish-controls";
import { toDatetimeLocalValue } from "@/features/scheduling/lib/schedule-format";

import { createAssignmentAction, updateAssignmentAction } from "../actions/assignment-mutations";
import type { ActionResult, AssignmentSummary, TopicSummary } from "../types";

const initialState: ActionResult<AssignmentSummary> | null = null;

interface AssignmentFormDialogProps {
  mode: "create" | "edit";
  classroomId: string;
  assignment?: AssignmentSummary;
  topics: TopicSummary[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignmentFormDialog({
  mode,
  classroomId,
  assignment,
  topics,
  open,
  onOpenChange,
}: AssignmentFormDialogProps) {
  const router = useRouter();
  const action = mode === "create" ? createAssignmentAction : updateAssignmentAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [publishMode, setPublishMode] = useState<PublishMode>("DRAFT");
  const [scheduledFor, setScheduledFor] = useState("");

  useEffect(() => {
    if (!state) {
      return;
    }

    if (state.status === "success") {
      toast.success(mode === "create" ? "Assignment saved" : "Assignment updated");
      onOpenChange(false);
      formRef.current?.reset();
      router.refresh();
    } else if (!state.fieldErrors) {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fieldErrors = state?.status === "error" ? state.fieldErrors : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Create assignment" : "Edit assignment"}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Give your class work to complete."
                : "Update the assignment's details."}
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" name="classroomId" value={classroomId} />
          {mode === "edit" && assignment ? (
            <input type="hidden" name="assignmentId" value={assignment.id} />
          ) : null}

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assignment-title">Title</Label>
              <Input
                id="assignment-title"
                name="title"
                defaultValue={assignment?.title}
                required
                maxLength={150}
                autoFocus
              />
              {fieldErrors?.title ? (
                <p className="text-xs text-destructive">{fieldErrors.title[0]}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assignment-description">Instructions</Label>
              <Textarea
                id="assignment-description"
                name="description"
                defaultValue={assignment?.description ?? ""}
                rows={4}
                maxLength={5000}
              />
              {fieldErrors?.description ? (
                <p className="text-xs text-destructive">{fieldErrors.description[0]}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assignment-dueDate">Due date</Label>
                <Input
                  id="assignment-dueDate"
                  name="dueDate"
                  type="datetime-local"
                  defaultValue={toDatetimeLocalValue(assignment?.dueDate)}
                />
                {fieldErrors?.dueDate ? (
                  <p className="text-xs text-destructive">{fieldErrors.dueDate[0]}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assignment-points">Points</Label>
                <Input
                  id="assignment-points"
                  name="points"
                  type="number"
                  min={0}
                  max={100000}
                  placeholder="Ungraded"
                  defaultValue={assignment?.points ?? ""}
                />
                {fieldErrors?.points ? (
                  <p className="text-xs text-destructive">{fieldErrors.points[0]}</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assignment-topic">Topic</Label>
              <Select id="assignment-topic" name="topicId" defaultValue={assignment?.topicId ?? ""}>
                <option value="">No topic</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </Select>
              {fieldErrors?.topicId ? (
                <p className="text-xs text-destructive">{fieldErrors.topicId[0]}</p>
              ) : null}
            </div>

            {mode === "create" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="assignment-files">Attachments</Label>
                <input
                  id="assignment-files"
                  name="files"
                  type="file"
                  multiple
                  className="text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  File names are recorded now; storing file contents isn&apos;t wired up yet.
                </p>
              </div>
            ) : null}

            {mode === "create" ? (
              <PublishControls
                mode={publishMode}
                onModeChange={setPublishMode}
                scheduledFor={scheduledFor}
                onScheduledForChange={setScheduledFor}
                fieldError={fieldErrors?.scheduledFor?.[0]}
                disabled={isPending}
                publishLabel="Assign"
              />
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving…"
                : mode === "edit"
                  ? "Save"
                  : publishMode === "DRAFT"
                    ? "Save draft"
                    : publishMode === "SCHEDULED"
                      ? "Schedule"
                      : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
