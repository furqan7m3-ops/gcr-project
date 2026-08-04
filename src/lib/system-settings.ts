import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

// A fixed, well-known id so the service layer always reads/writes the same
// singleton row rather than ever risking a second settings row being created.
export const SYSTEM_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Reads the platform's single settings row, creating it with defaults on
 * first access. Memoized per-request via React's cache() so every feature
 * reading settings within the same render tree shares one query instead of
 * each issuing its own.
 *
 * Reads via findUnique rather than unconditionally upserting - the row
 * exists after first access, so every subsequent request only needs a plain
 * read instead of paying for an upsert's write path on every page load.
 */
export const getSystemSettings = cache(async () => {
  const existing = await prisma.systemSettings.findUnique({ where: { id: SYSTEM_SETTINGS_ID } });
  if (existing) {
    return existing;
  }

  try {
    return await prisma.systemSettings.create({ data: { id: SYSTEM_SETTINGS_ID } });
  } catch (error) {
    // Two concurrent first-reads can both miss the row and race to create it
    // (seen in practice: Next.js prerenders multiple pages in parallel
    // workers, each calling this on a cold database). Whichever loses just
    // re-reads the row the winner created instead of failing.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.systemSettings.findUniqueOrThrow({ where: { id: SYSTEM_SETTINGS_ID } });
    }
    throw error;
  }
});

export type SystemSettings = Awaited<ReturnType<typeof getSystemSettings>>;
