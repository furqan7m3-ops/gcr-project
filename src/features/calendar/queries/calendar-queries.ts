import { getClassroomSearchScope } from "@/features/classroom/services/classroom-service";
import { requireUser } from "@/lib/auth/permissions";

import * as calendarService from "../services/calendar-service";
import type { CalendarFilterOptions } from "../services/calendar-service";
import type { CalendarEvent, CalendarEventType, CalendarFilters, CalendarRange } from "../types";

/** Standalone entry point for a single range (e.g. calendar-actions.ts's future client widget). Prefer getCalendarPageData for anything that needs multiple ranges/queries in one request - it shares one auth check and one scope computation across all of them. */
export async function getCalendarEvents(filters: CalendarFilters): Promise<CalendarEvent[]> {
  const user = await requireUser();
  const scope = await getClassroomSearchScope(user);
  return calendarService.getEvents(user, scope, filters);
}

/** Server-only entry point for the classroom filter dropdown's options. */
export async function getCalendarFilterOptions(): Promise<CalendarFilterOptions> {
  const user = await requireUser();
  const scope = await getClassroomSearchScope(user);
  return calendarService.getFilterOptions(scope);
}

export interface CalendarPageQuery {
  gridRange: CalendarRange;
  todayRange: CalendarRange;
  upcomingRange: CalendarRange;
  monthRange: CalendarRange;
  classroomId?: string;
  eventTypes?: CalendarEventType[];
}

export interface CalendarPageData {
  events: CalendarEvent[];
  todayEvents: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  monthAgendaEvents: CalendarEvent[];
  filterOptions: CalendarFilterOptions;
}

/**
 * The /calendar page's single entry point (Phase 16.4). The page needs
 * events for four different ranges at once - the active grid view, today,
 * the upcoming window, and the browsed month - plus the filter dropdown's
 * classroom list, all for the same signed-in user. Computing the session and
 * classroom scope exactly once here and sharing both across all five
 * underlying calls - instead of each one independently re-deriving them,
 * which is what calling getCalendarEvents/getCalendarFilterOptions five
 * times in parallel used to do - cuts what was 5 separate auth checks and up
 * to 13 separate classroom-scope queries down to exactly one of each.
 */
export async function getCalendarPageData(query: CalendarPageQuery): Promise<CalendarPageData> {
  const user = await requireUser();
  const scope = await getClassroomSearchScope(user);

  const baseFilters = { classroomId: query.classroomId, eventTypes: query.eventTypes };

  const [events, todayEvents, upcomingEvents, monthAgendaEvents, filterOptions] = await Promise.all(
    [
      calendarService.getEvents(user, scope, { ...baseFilters, range: query.gridRange }),
      calendarService.getEvents(user, scope, { ...baseFilters, range: query.todayRange }),
      calendarService.getEvents(user, scope, { ...baseFilters, range: query.upcomingRange }),
      calendarService.getEvents(user, scope, { ...baseFilters, range: query.monthRange }),
      calendarService.getFilterOptions(scope),
    ],
  );

  return { events, todayEvents, upcomingEvents, monthAgendaEvents, filterOptions };
}
