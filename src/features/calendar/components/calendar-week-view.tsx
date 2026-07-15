import Link from "next/link";

import { cn } from "@/lib/utils";

import { CalendarEventRow } from "./calendar-event-row";
import {
  buildCalendarHref,
  getEventsForDay,
  getWeekDays,
  groupEventsByDay,
  isToday,
  type CalendarHrefFilters,
} from "../lib/calendar-date";
import { formatDayNumber, formatDayTitle, formatWeekdayShort } from "../lib/calendar-format";
import type { CalendarEvent } from "../types";

// Caps a single busy day at a fixed number of visible rows instead of
// letting it grow unbounded and stretch the whole week's row height on every
// screen size - same overflow pattern CalendarMonthView already uses, now
// applied consistently across both grid views.
const MAX_VISIBLE_EVENTS_PER_DAY = 4;

interface CalendarWeekViewProps {
  date: Date;
  events: CalendarEvent[];
  filters?: CalendarHrefFilters;
}

export function CalendarWeekView({ date, events, filters }: CalendarWeekViewProps) {
  const days = getWeekDays(date);
  const eventsByDay = groupEventsByDay(events);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-7 lg:gap-2">
      {days.map((day) => {
        const dayEvents = getEventsForDay(eventsByDay, day);
        const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS_PER_DAY);
        const overflowCount = dayEvents.length - visibleEvents.length;
        const today = isToday(day);

        return (
          <div
            key={day.toISOString()}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-2"
          >
            <Link
              href={buildCalendarHref("day", day, filters)}
              aria-label={`${formatDayTitle(day)}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ""}`}
              aria-current={today ? "date" : undefined}
              className="flex items-center justify-between gap-2 rounded-md px-1 py-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:flex-col lg:items-center lg:gap-0.5"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {formatWeekdayShort(day)}
              </span>
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                  today ? "bg-primary text-primary-foreground" : "text-foreground",
                )}
              >
                {formatDayNumber(day)}
              </span>
            </Link>
            <div className="flex flex-col gap-1.5">
              {dayEvents.length === 0 ? (
                <p className="px-1 text-xs text-muted-foreground">No events</p>
              ) : (
                <>
                  {visibleEvents.map((event) => (
                    <CalendarEventRow key={event.id} event={event} />
                  ))}
                  {overflowCount > 0 ? (
                    <Link
                      href={buildCalendarHref("day", day, filters)}
                      className="rounded px-1 text-left text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      +{overflowCount} more
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
