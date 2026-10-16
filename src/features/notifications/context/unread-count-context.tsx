"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const NOTIFICATIONS_PATH = "/notifications";
// A plain GET route, not a Server Action - see the route handler for why.
const UNREAD_COUNT_URL = "/api/notifications/unread-count";
const POLL_INTERVAL_MS = 30_000;

interface UnreadCountValue {
  count: number;
  /** Apply an optimistic change (e.g. -1 when one notification is marked read). */
  adjust: (delta: number) => void;
}

const UnreadCountContext = createContext<UnreadCountValue | null>(null);

/**
 * Single source of truth for the unread-notification count, shared by the
 * header bell and the sidebar's Notifications dot so the two never disagree.
 *
 * Opening the notifications page marks everything read (the page does that on
 * the server), so the count drops to 0 the moment the user navigates there -
 * no "mark all read" click needed. Elsewhere it's refreshed on every
 * navigation, when the window regains focus, and every 30s, so new
 * notifications show up without a full reload (the app layout that seeds
 * `initialCount` isn't re-rendered on client-side navigation).
 */
export function UnreadCountProvider({
  initialCount,
  children,
}: {
  /** Omit when the caller has no server-side count; it's fetched on mount instead. */
  initialCount?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const onNotificationsPage = pathname === NOTIFICATIONS_PATH;

  const [count, setCount] = useState(onNotificationsPage ? 0 : (initialCount ?? 0));

  // Adjusting state while rendering (React's documented alternative to an
  // effect): arriving on the notifications page clears the dot immediately.
  const [previousPathname, setPreviousPathname] = useState(pathname);
  if (pathname !== previousPathname) {
    setPreviousPathname(pathname);
    if (onNotificationsPage) {
      setCount(0);
    }
  }

  useEffect(() => {
    // On the notifications page itself everything has just been marked read.
    if (onNotificationsPage) {
      return;
    }

    let cancelled = false;
    const refresh = () => {
      fetch(UNREAD_COUNT_URL, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((body: { count?: unknown } | null) => {
          if (!cancelled && typeof body?.count === "number") {
            setCount(body.count);
          }
        })
        .catch(() => {
          // Best-effort: keep the last known count; the next poll will retry.
        });
    };

    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    window.addEventListener("focus", refresh);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [pathname, onNotificationsPage]);

  const adjust = useCallback(
    (delta: number) => setCount((previous) => Math.max(0, previous + delta)),
    [],
  );

  const value = useMemo(() => ({ count, adjust }), [count, adjust]);

  return <UnreadCountContext.Provider value={value}>{children}</UnreadCountContext.Provider>;
}

/** The shared unread count, or null outside an UnreadCountProvider. */
export function useUnreadCount(): UnreadCountValue | null {
  return useContext(UnreadCountContext);
}
