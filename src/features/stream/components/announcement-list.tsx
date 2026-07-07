import type { AnnouncementSummary } from "../types";
import { AnnouncementCard } from "./announcement-card";
import { StreamEmptyState } from "./stream-empty-state";

export function AnnouncementList({ announcements }: { announcements: AnnouncementSummary[] }) {
  if (announcements.length === 0) {
    return <StreamEmptyState />;
  }

  return (
    <div className="flex flex-col gap-4">
      {announcements.map((announcement) => (
        <AnnouncementCard key={announcement.id} announcement={announcement} />
      ))}
    </div>
  );
}
