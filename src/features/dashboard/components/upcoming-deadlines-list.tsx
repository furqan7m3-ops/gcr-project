import { CalendarClock } from "lucide-react";

import { formatDueDate } from "@/features/classwork/lib/format-assignment";

import type { UpcomingDeadlineItem } from "../types";
import { UpcomingItemsList } from "./upcoming-items-list";

export function UpcomingDeadlinesList({ items }: { items: UpcomingDeadlineItem[] }) {
  return (
    <UpcomingItemsList
      items={items.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.classroomTitle,
        dateLabel: formatDueDate(item.dueDate) ?? "",
        href: `/classes/${item.classroomId}/classwork/${item.id}`,
        icon: CalendarClock,
      }))}
      emptyTitle="No upcoming deadlines"
      emptyDescription="Assignments due soon across your classes will show up here."
    />
  );
}
