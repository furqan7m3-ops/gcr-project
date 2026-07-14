"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, MoreVertical, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModerationStatus } from "@/generated/prisma/enums";

import {
  archiveContentAction,
  deleteContentAction,
  restoreContentAction,
} from "../actions/moderation-mutations";
import { contentTypeLabels } from "../lib/moderation-display";
import type { ModerationItem } from "../types";

type ConfirmActionType = "archive" | "restore" | "delete";

const confirmCopy: Record<
  ConfirmActionType,
  { title: (title: string) => string; description: string; confirmLabel: string }
> = {
  archive: {
    title: (title) => `Archive "${title}"?`,
    description: "This hides the content from the classroom. It can be restored later.",
    confirmLabel: "Archive",
  },
  restore: {
    title: (title) => `Restore "${title}"?`,
    description: "This makes the content visible in its classroom again.",
    confirmLabel: "Restore",
  },
  delete: {
    title: (title) => `Delete "${title}"?`,
    description:
      "This soft-deletes the content. It becomes hidden immediately and can be restored later.",
    confirmLabel: "Delete",
  },
};

export function ModerationRowActions({ item }: { item: ModerationItem }) {
  const router = useRouter();
  const [confirmType, setConfirmType] = useState<ConfirmActionType | null>(null);
  const [isPending, startTransition] = useTransition();

  const isActive = item.moderationStatus === ModerationStatus.ACTIVE;
  const isDeleted = item.moderationStatus === ModerationStatus.DELETED;

  function handleConfirm() {
    if (!confirmType) {
      return;
    }

    startTransition(async () => {
      const action =
        confirmType === "archive"
          ? archiveContentAction
          : confirmType === "restore"
            ? restoreContentAction
            : deleteContentAction;

      const result = await action(item.contentType, item.id);
      const label = contentTypeLabels[item.contentType];

      if (result.status === "success") {
        toast.success(
          confirmType === "archive"
            ? `${label} archived`
            : confirmType === "restore"
              ? `${label} restored`
              : `${label} deleted`,
        );
      } else {
        toast.error(result.message);
      }

      setConfirmType(null);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Actions for ${item.title}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isActive ? (
            <DropdownMenuItem onSelect={() => setConfirmType("archive")}>
              <Archive /> Archive
            </DropdownMenuItem>
          ) : null}
          {!isActive ? (
            <DropdownMenuItem onSelect={() => setConfirmType("restore")}>
              <RotateCcw /> Restore
            </DropdownMenuItem>
          ) : null}
          {!isDeleted ? (
            <DropdownMenuItem
              onSelect={() => setConfirmType("delete")}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {confirmType ? (
        <ConfirmDialog
          open={confirmType !== null}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmType(null);
            }
          }}
          title={confirmCopy[confirmType].title(item.title)}
          description={confirmCopy[confirmType].description}
          confirmLabel={confirmCopy[confirmType].confirmLabel}
          destructive={confirmType === "delete"}
          pending={isPending}
          onConfirm={handleConfirm}
        />
      ) : null}
    </>
  );
}
