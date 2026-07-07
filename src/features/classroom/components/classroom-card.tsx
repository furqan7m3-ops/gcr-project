import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

import { canManageClassroom } from "../lib/can-manage";
import type { ClassroomSummary } from "../types";
import { ClassroomCover } from "./classroom-cover";
import { ClassroomQuickActionsMenu } from "./classroom-quick-actions-menu";

export function ClassroomCard({ classroom }: { classroom: ClassroomSummary }) {
  const canManage = canManageClassroom(classroom.role);

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <ClassroomCover
        classroomId={classroom.id}
        title={classroom.title}
        section={classroom.section}
      />
      <div className="flex items-start justify-between gap-2 px-4 pt-3">
        <Link
          href={`/classes/${classroom.id}`}
          className="min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <p className="truncate text-base font-semibold text-foreground">{classroom.title}</p>
          {classroom.section ? (
            <p className="truncate text-sm text-muted-foreground">{classroom.section}</p>
          ) : null}
        </Link>
        <ClassroomQuickActionsMenu classroom={classroom} canManage={canManage} />
      </div>
      <CardContent className="flex flex-1 flex-col justify-end gap-3 pt-2">
        <p className="truncate text-sm text-muted-foreground">{classroom.ownerName}</p>
        <p className="font-mono text-xs text-muted-foreground">{classroom.code}</p>
      </CardContent>
    </Card>
  );
}
