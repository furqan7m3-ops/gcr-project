"use server";

import { getClassroomSearchScope } from "@/features/classroom/services/classroom-service";
import { requireUser } from "@/lib/auth/permissions";

import * as calendarService from "../services/calendar-service";
import type { CalendarEvent, CalendarFilters } from "../types";

/**
 * Client-invokable calendar entry point - thin by design, same convention as
 * globalSearchAction. The /calendar page itself is a server component using
 * the queries layer directly (URL-driven navigation, no client fetch needed);
 * this exists for a future client-side calendar widget (e.g. a mini picker)
 * that needs to fetch events without a full page navigation.
 */
export async function getCalendarEventsAction(filters: CalendarFilters): Promise<CalendarEvent[]> {
  const user = await requireUser();
  const scope = await getClassroomSearchScope(user);
  return calendarService.getEvents(user, scope, filters);
}
