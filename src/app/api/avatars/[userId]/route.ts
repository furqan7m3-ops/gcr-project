import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AuthError, requireUser } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";
import { getImageMimeType } from "@/lib/storage/image-mime";

export const runtime = "nodejs";

/**
 * The one authorized entry point for a self-uploaded avatar. Unlike lesson
 * attachments or classroom covers, an avatar has no meaningful "who's
 * allowed to see this" boundary beyond being signed in - avatars show up in
 * rosters, comments, and admin tables to any authenticated user who can see
 * that person elsewhere in the app, so this only requires requireUser(),
 * not a per-target authorization check.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  try {
    await requireUser();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarStorageKey: true },
  });

  if (!user?.avatarStorageKey) {
    return NextResponse.json({ error: "No avatar." }, { status: 404 });
  }

  const provider = getStorageProvider();
  if (!(await provider.exists(user.avatarStorageKey))) {
    return NextResponse.json({ error: "Avatar not found in storage." }, { status: 404 });
  }

  const stream = await provider.read(user.avatarStorageKey);

  return new NextResponse(stream, {
    headers: {
      "Content-Type": getImageMimeType(user.avatarStorageKey),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
