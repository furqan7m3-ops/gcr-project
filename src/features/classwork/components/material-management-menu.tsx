"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePendingAction } from "@/hooks/use-pending-action";

import { deleteMaterialAction } from "../actions/material-mutations";
import type { MaterialSummary, TopicSummary } from "../types";
import { MaterialFormDialog } from "./material-form-dialog";

interface MaterialManagementMenuProps {
  classroomId: string;
  material: MaterialSummary;
  topics: TopicSummary[];
}

export function MaterialManagementMenu({
  classroomId,
  material,
  topics,
}: MaterialManagementMenuProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const remove = usePendingAction(
    () => deleteMaterialAction(classroomId, material.id),
    () => {
      toast.success("Material deleted");
      setDeleteOpen(false);
      router.refresh();
    },
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Options for ${material.title}`}
            className="h-8 w-8 shrink-0"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MaterialFormDialog
        mode="edit"
        classroomId={classroomId}
        material={material}
        topics={topics}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this material?"
        description={`"${material.title}" will be removed from Classwork. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={remove.run}
      />
    </>
  );
}
