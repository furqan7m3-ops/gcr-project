import { canManageClassroom } from "../lib/can-manage";
import type { ClassroomSummary } from "../types";
import { ClassroomCover } from "./classroom-cover";
import { ClassroomQuickActionsMenu } from "./classroom-quick-actions-menu";

export function ClassroomHeader({ classroom }: { classroom: ClassroomSummary }) {
  const canManage = canManageClassroom(classroom.role);

  return (
    <div className="relative">
      <ClassroomCover
        classroomId={classroom.id}
        title={classroom.title}
        section={classroom.section}
        className="h-40 rounded-none sm:h-48"
      />
      <div className="absolute right-4 top-4">
        <ClassroomQuickActionsMenu
          classroom={classroom}
          canManage={canManage}
          triggerClassName="text-white hover:bg-white/15 hover:text-white"
        />
      </div>
    </div>
  );
}
