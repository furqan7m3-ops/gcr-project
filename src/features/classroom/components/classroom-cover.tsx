import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";

import { getClassroomAccent } from "../constants/classroom-colors";

interface ClassroomCoverProps {
  classroomId: string;
  title: string;
  section?: string | null;
  hasCoverImage?: boolean;
  className?: string;
}

export function ClassroomCover({
  classroomId,
  title,
  section,
  hasCoverImage,
  className,
}: ClassroomCoverProps) {
  const accent = getClassroomAccent(classroomId);

  return (
    <div
      className={cn(
        "relative flex h-28 flex-col justify-end overflow-hidden rounded-t-xl p-4",
        hasCoverImage ? "bg-muted" : accent.bannerClassName,
        className,
      )}
    >
      {hasCoverImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- authorized, non-static app route, not a candidate for next/image optimization */}
          <img
            src={`/api/classroom-covers/${classroomId}`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </>
      ) : (
        <GraduationCap className="absolute right-4 top-4 h-10 w-10 text-white/25" aria-hidden />
      )}
      <p className="relative truncate text-lg font-semibold text-white">{title}</p>
      {section ? <p className="relative truncate text-sm text-white/80">{section}</p> : null}
    </div>
  );
}
