import { ClipboardList, FileText, Megaphone } from "lucide-react";

import { formatScheduledFor } from "@/features/scheduling/lib/schedule-format";

import type { UpcomingPublicationItem } from "../types";
import { UpcomingItemsList } from "./upcoming-items-list";

const CONTENT_TYPE_ICON = {
  announcement: Megaphone,
  assignment: ClipboardList,
  material: FileText,
} as const;

function hrefFor(item: UpcomingPublicationItem): string {
  const base = `/classes/${item.classroomId}`;
  return item.contentType === "announcement" ? `${base}/stream` : `${base}/classwork`;
}

export function UpcomingPublicationsList({ items }: { items: UpcomingPublicationItem[] }) {
  return (
    <UpcomingItemsList
      items={items.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.classroomTitle,
        dateLabel: formatScheduledFor(item.scheduledFor),
        href: hrefFor(item),
        icon: CONTENT_TYPE_ICON[item.contentType],
      }))}
      emptyTitle="Nothing scheduled"
      emptyDescription="Content you schedule for later will show up here as it approaches."
    />
  );
}
