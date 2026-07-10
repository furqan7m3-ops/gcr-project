"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserMinus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { leaveClassroomAction, removeMemberAction } from "../actions/classroom-mutations";
import type { ClassroomMemberSummary, ClassroomRoster } from "../types";
import { RosterSection } from "./roster-section";

type RosterOptimisticAction = { type: "remove"; userId: string };

function rosterReducer(state: ClassroomRoster, action: RosterOptimisticAction): ClassroomRoster {
  return {
    teachers: state.teachers.filter((member) => member.id !== action.userId),
    students: state.students.filter((member) => member.id !== action.userId),
  };
}

interface RosterManagerProps {
  classroomId: string;
  classroomTitle: string;
  initialRoster: ClassroomRoster;
  viewerId: string;
  canManage: boolean;
}

export function RosterManager({
  classroomId,
  classroomTitle,
  initialRoster,
  viewerId,
  canManage,
}: RosterManagerProps) {
  const router = useRouter();
  const [optimisticRoster, applyOptimistic] = useOptimistic(initialRoster, rosterReducer);
  const [removeTarget, setRemoveTarget] = useState<ClassroomMemberSummary | null>(null);
  const [isRemoving, startRemoveTransition] = useTransition();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [isLeaving, startLeaveTransition] = useTransition();

  function handleRemoveConfirm() {
    const target = removeTarget;
    if (!target) {
      return;
    }

    startRemoveTransition(async () => {
      applyOptimistic({ type: "remove", userId: target.id });

      const result = await removeMemberAction(classroomId, target.id);

      if (result.status === "success") {
        toast.success(`${target.name} removed from ${classroomTitle}`);
        setRemoveTarget(null);
      } else {
        toast.error(result.message);
      }

      // Reconciles the optimistic state with the server either way: on
      // success this re-fetches the roster without the removed member; on
      // failure it re-fetches the original roster, undoing the optimistic removal.
      router.refresh();
    });
  }

  function handleLeaveConfirm() {
    startLeaveTransition(async () => {
      const result = await leaveClassroomAction(classroomId);

      if (result.status === "success") {
        toast.success(`Left ${classroomTitle}`);
        router.push("/classes");
      } else {
        toast.error(result.message);
        setLeaveOpen(false);
      }
    });
  }

  function renderRemoveAction(member: ClassroomMemberSummary) {
    if (!canManage || member.role === "OWNER" || member.id === viewerId) {
      return null;
    }

    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setRemoveTarget(member)}
      >
        <UserMinus /> Remove
      </Button>
    );
  }

  return (
    <>
      <RosterSection
        title="Teachers"
        members={optimisticRoster.teachers}
        emptyMessage="No teachers found."
        renderAction={renderRemoveAction}
      />
      <RosterSection
        title="Students"
        members={optimisticRoster.students}
        emptyMessage="No students have joined this class yet."
        renderAction={renderRemoveAction}
      />

      {!canManage ? (
        <Button
          type="button"
          variant="outline"
          className="w-fit text-destructive hover:text-destructive"
          onClick={() => setLeaveOpen(true)}
        >
          <LogOut /> Leave class
        </Button>
      ) : null}

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null);
          }
        }}
        title={`Remove ${removeTarget?.name ?? "this member"}?`}
        description={`${removeTarget?.name ?? "They"} will lose access to ${classroomTitle} immediately. They can rejoin later with the class code.`}
        confirmLabel="Remove"
        destructive
        pending={isRemoving}
        onConfirm={handleRemoveConfirm}
      />

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Leave this class?"
        description={`You'll need the class code to rejoin ${classroomTitle} later.`}
        confirmLabel="Leave"
        destructive
        pending={isLeaving}
        onConfirm={handleLeaveConfirm}
      />
    </>
  );
}
