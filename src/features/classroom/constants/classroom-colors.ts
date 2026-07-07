// Deterministic per-classroom accent, so a class always shows the same banner color
// without storing one - hashed from the classroom id. See docs/ui-architecture.md §5.
const ACCENTS = [
  { key: "indigo", bannerClassName: "bg-indigo-600" },
  { key: "teal", bannerClassName: "bg-teal-600" },
  { key: "amber", bannerClassName: "bg-amber-600" },
  { key: "rose", bannerClassName: "bg-rose-600" },
  { key: "violet", bannerClassName: "bg-violet-600" },
  { key: "emerald", bannerClassName: "bg-emerald-600" },
  { key: "sky", bannerClassName: "bg-sky-600" },
  { key: "orange", bannerClassName: "bg-orange-600" },
] as const;

export function getClassroomAccent(classroomId: string) {
  let hash = 0;

  for (let i = 0; i < classroomId.length; i += 1) {
    hash = (hash * 31 + classroomId.charCodeAt(i)) >>> 0;
  }

  return ACCENTS[hash % ACCENTS.length];
}
