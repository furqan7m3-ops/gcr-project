import { NextResponse } from "next/server";

import { AuthError } from "@/lib/auth/permissions";
import { getUnreadNotificationCount } from "@/features/notifications/queries/notification-queries";

export const runtime = "nodejs";

/**
 * Unread-notification count for the signed-in user, polled by
 * UnreadCountProvider on every navigation.
 *
 * Deliberately a plain GET route rather than a Server Action: a Server Action
 * fired while a client navigation is still resolving (e.g. /classes/[id]
 * redirecting to /stream) collides with the App Router's own navigation and
 * can force a hard reload that crashes with "Rendered more hooks than during
 * the previous render". A regular fetch never touches router state.
 */
export async function GET() {
  try {
    const count = await getUnreadNotificationCount();
    return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Couldn't load your notification count." }, { status: 500 });
  }
}
