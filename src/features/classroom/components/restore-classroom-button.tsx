"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { usePendingAction } from "@/hooks/use-pending-action";

import { restoreClassroomAction } from "../actions/classroom-mutations";

export function RestoreClassroomButton({ classroomId }: { classroomId: string }) {
  const router = useRouter();

  const restore = usePendingAction(
    () => restoreClassroomAction(classroomId),
    () => {
      toast.success("Class restored");
      router.refresh();
    },
  );

  return (
    <Button type="button" size="sm" onClick={restore.run} disabled={restore.isPending}>
      <RotateCcw className="h-3.5 w-3.5" />
      {restore.isPending ? "Restoring…" : "Restore class"}
    </Button>
  );
}
