import { CalendarMonthlyAgenda } from "./calendar-monthly-agenda";
import { CalendarTodayEvents } from "./calendar-today-events";
import { CalendarUpcomingEvents } from "./calendar-upcoming-events";
import type { CalendarEvent } from "../types";

interface CalendarSidebarProps {
  todayEvents: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  monthEvents: CalendarEvent[];
  monthLabel: string;
}

/** Today / Upcoming / Monthly agenda - independent of whichever grid view (Month/Week/Day) is active, and of the browsed date except for the agenda, which follows the browsed month. */
export function CalendarSidebar({
  todayEvents,
  upcomingEvents,
  monthEvents,
  monthLabel,
}: CalendarSidebarProps) {
  return (
    <aside className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
      <CalendarTodayEvents events={todayEvents} />
      <CalendarUpcomingEvents events={upcomingEvents} />
      <CalendarMonthlyAgenda monthLabel={monthLabel} events={monthEvents} />
    </aside>
  );
}
