"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ClassroomFormDialog } from "./classroom-form-dialog";
import { JoinClassroomDialog } from "./join-classroom-dialog";

export function ClassesPageActions({ canCreate }: { canCreate: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("code") ?? undefined;
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  // A shared invite link (see InvitationDialog) lands here as /classes?code=...
  // - pop the Join dialog pre-filled instead of silently auto-joining, since
  // joining is a real mutation that should still take an explicit click.
  useEffect(() => {
    if (inviteCode) {
      startTransition(() => setJoinOpen(true));
      router.replace("/classes");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode]);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => setJoinOpen(true)}>
        <UsersRound /> Join class
      </Button>
      {canCreate ? (
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> Create class
        </Button>
      ) : null}

      {canCreate ? (
        <ClassroomFormDialog
          mode="create"
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSaved={(classroom) => router.push(`/classes/${classroom.id}`)}
        />
      ) : null}
      <JoinClassroomDialog open={joinOpen} onOpenChange={setJoinOpen} defaultCode={inviteCode} />
    </div>
  );
}
