"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ClassroomFormDialog } from "./classroom-form-dialog";
import { JoinClassroomDialog } from "./join-classroom-dialog";

export function ClassesPageActions({ canCreate }: { canCreate: boolean }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

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
      <JoinClassroomDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
}
