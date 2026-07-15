"use client";

import { cn } from "@/lib/utils";

import { useCalendarEventDialog } from "../context/calendar-event-dialog-context";
import { CALENDAR_EVENT_TYPE_COLOR, CALENDAR_EVENT_TYPE_LABEL } from "../lib/calendar-display";
import { formatEventTime, formatShortDate } from "../lib/calendar-format";
import type { CalendarEvent } from "../types";

interface CalendarEventRowProps {
  event: CalendarEvent;
  /** Also show the event's date, not just its time - for sidebar sections (Today/Upcoming/Agenda) whose rows can span many different days, unlike a single day/week column. */
  showDate?: boolean;
}

/** Fuller row shared by the week/day grid views and every sidebar section. Clicking it opens CalendarEventDetailsDialog rather than navigating directly. */
export function CalendarEventRow({ event, showDate = false }: CalendarEventRowProps) {
  const { openEvent } = useCalendarEventDialog();

  return (
    <button
      type="button"
      onClick={() => openEvent(event)}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-opacity hover:opacity-80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        CALENDAR_EVENT_TYPE_COLOR[event.type],
      )}
    >
      <div className="flex w-16 shrink-0 flex-col text-xs font-medium opacity-80">
        {showDate ? <span>{formatShortDate(event.start)}</span> : null}
        <span>{event.allDay ? "All day" : formatEventTime(event.start)}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{event.title}</span>
        <span className="truncate text-xs opacity-80">
          {CALENDAR_EVENT_TYPE_LABEL[event.type]}
          {event.classroomTitle ? ` · ${event.classroomTitle}` : ""}
        </span>
      </div>
    </button>
  );
}
