import { PageContainer } from "@/components/page/page-container";
import { SectionHeader } from "@/components/page/section-header";

import { CalendarDayView } from "@/features/calendar/components/calendar-day-view";
import { CalendarEventDetailsDialog } from "@/features/calendar/components/calendar-event-details-dialog";
import { CalendarFilterBar } from "@/features/calendar/components/calendar-filter-bar";
import { CalendarMonthView } from "@/features/calendar/components/calendar-month-view";
import { CalendarSidebar } from "@/features/calendar/components/calendar-sidebar";
import { CalendarToolbar } from "@/features/calendar/components/calendar-toolbar";
import { CalendarWeekView } from "@/features/calendar/components/calendar-week-view";
import { CalendarEventDialogProvider } from "@/features/calendar/context/calendar-event-dialog-context";
import {
  addDays,
  endOfDay,
  endOfMonth,
  getRangeForView,
  startOfDay,
  startOfMonth,
} from "@/features/calendar/lib/calendar-date";
import { formatMonthTitle } from "@/features/calendar/lib/calendar-format";
import { parseCalendarParams, type RawSearchParams } from "@/features/calendar/lib/calendar-params";
import { getCalendarPageData } from "@/features/calendar/queries/calendar-queries";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

const UPCOMING_WINDOW_DAYS = 14;
const UPCOMING_EVENTS_LIMIT = 8;

export default async function CalendarPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const { view, date, classroomId, eventTypes } = parseCalendarParams(resolved);
  const gridRange = getRangeForView(date, view);
  const filters = { classroomId, eventTypes };
  const scopedEventTypes = eventTypes.length > 0 ? eventTypes : undefined;

  const now = new Date();
  const todayRange = { start: startOfDay(now), end: endOfDay(now) };
  const upcomingRange = {
    start: startOfDay(addDays(now, 1)),
    end: endOfDay(addDays(now, UPCOMING_WINDOW_DAYS)),
  };
  const monthRange = { start: startOfMonth(date), end: endOfMonth(date) };

  const { events, todayEvents, upcomingEvents, monthAgendaEvents, filterOptions } =
    await getCalendarPageData({
      gridRange,
      todayRange,
      upcomingRange,
      monthRange,
      classroomId,
      eventTypes: scopedEventTypes,
    });

  return (
    <CalendarEventDialogProvider>
      <PageContainer>
        <SectionHeader
          title="Calendar"
          description="Due dates and classroom events, aggregated across all your classes."
        />
        <CalendarFilterBar
          classrooms={filterOptions.classrooms}
          classroomId={classroomId}
          eventTypes={eventTypes}
        />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <CalendarToolbar
              date={date}
              view={view}
              range={gridRange}
              classroomId={classroomId}
              eventTypes={eventTypes}
            />
            {view === "month" ? (
              <CalendarMonthView date={date} events={events} filters={filters} />
            ) : null}
            {view === "week" ? (
              <CalendarWeekView date={date} events={events} filters={filters} />
            ) : null}
            {view === "day" ? <CalendarDayView date={date} events={events} /> : null}
          </div>
          <CalendarSidebar
            todayEvents={todayEvents}
            upcomingEvents={upcomingEvents.slice(0, UPCOMING_EVENTS_LIMIT)}
            monthEvents={monthAgendaEvents}
            monthLabel={formatMonthTitle(date)}
          />
        </div>
        <CalendarEventDetailsDialog />
      </PageContainer>
    </CalendarEventDialogProvider>
  );
}
