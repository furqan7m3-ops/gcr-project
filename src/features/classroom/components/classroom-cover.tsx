import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";

import { getClassroomAccent } from "../constants/classroom-colors";

interface ClassroomCoverProps {
  classroomId: string;
  title: string;
  section?: string | null;
  className?: string;
}

export function ClassroomCover({ classroomId, title, section, className }: ClassroomCoverProps) {
  const accent = getClassroomAccent(classroomId);

  return (
    <div
      className={cn(
        "relative flex h-28 flex-col justify-end overflow-hidden rounded-t-xl p-4",
        accent.bannerClassName,
        className,
      )}
    >
      <GraduationCap className="absolute right-4 top-4 h-10 w-10 text-white/25" aria-hidden />
      <p className="truncate text-lg font-semibold text-white">{title}</p>
      {section ? <p className="truncate text-sm text-white/80">{section}</p> : null}
    </div>
  );
}
