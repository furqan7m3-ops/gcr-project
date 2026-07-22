import type { ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

import type { ClassroomMemberSummary, ClassroomMembershipRole } from "../types";

const ROLE_LABEL: Record<ClassroomMembershipRole, string> = {
  OWNER: "Created By",
  TEACHER: "Teacher",
  CO_TEACHER: "Co-teacher",
  STUDENT: "Student",
  ASSISTANT: "Assistant",
};

function formatJoinedDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

interface RosterMemberRowProps {
  member: ClassroomMemberSummary;
  action?: ReactNode;
}

export function RosterMemberRow({ member, action }: RosterMemberRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
      <Avatar className="h-9 w-9 shrink-0">
        {member.image ? <AvatarImage src={member.image} alt={member.name} /> : null}
        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        {member.role === "OWNER" ? (
          <a
            href={`mailto:${member.email}`}
            className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
          >
            {member.name}
          </a>
        ) : (
          <span className="truncate text-sm font-medium text-foreground">{member.name}</span>
        )}
        <span className="truncate text-xs text-muted-foreground">{member.email}</span>
      </div>
      <Badge variant="outline">{ROLE_LABEL[member.role]}</Badge>
      <span className="text-xs text-muted-foreground">
        Joined {formatJoinedDate(member.joinedAt)}
      </span>
      {action}
    </div>
  );
}
