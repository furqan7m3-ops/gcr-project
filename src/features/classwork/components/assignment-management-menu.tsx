"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePendingAction } from "@/hooks/use-pending-action";

import {
  closeAssignmentAction,
  deleteAssignmentAction,
  publishAssignmentAction,
} from "../actions/assignment-mutations";
import type { AssignmentSummary, TopicSummary } from "../types";
import { AssignmentFormDialog } from "./assignment-form-dialog";

interface AssignmentManagementMenuProps {
  classroomId: string;
  assignment: AssignmentSummary;
  topics: TopicSummary[];
}

export function AssignmentManagementMenu({
  classroomId,
  assignment,
  topics,
}: AssignmentManagementMenuProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const publish = usePendingAction(
    () => publishAssignmentAction(classroomId, assignment.id),
    () => {
      toast.success("Assignment published");
      router.refresh();
    },
  );

  const close = usePendingAction(
    () => closeAssignmentAction(classroomId, assignment.id),
    () => {
      toast.success("Assignment closed");
      router.refresh();
    },
  );

  const remove = usePendingAction(
    () => deleteAssignmentAction(classroomId, assignment.id),
    () => {
      toast.success("Assignment deleted");
      setDeleteOpen(false);
      router.refresh();
    },
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={publish.isPending || close.isPending}>
            {assignment.status === "DRAFT"
              ? "Draft"
              : assignment.status === "CLOSED"
                ? "Closed"
                : "Manage"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          {assignment.status === "DRAFT" ? (
            <DropdownMenuItem onSelect={publish.run} disabled={publish.isPending}>
              <Send /> Publish
            </DropdownMenuItem>
          ) : null}
          {assignment.status === "PUBLISHED" ? (
            <DropdownMenuItem onSelect={close.run} disabled={close.isPending}>
              <Lock /> Close assignment
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AssignmentFormDialog
        mode="edit"
        classroomId={classroomId}
        assignment={assignment}
        topics={topics}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this assignment?"
        description={`"${assignment.title}" will be removed from Classwork. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={remove.run}
      />
    </>
  );
}
