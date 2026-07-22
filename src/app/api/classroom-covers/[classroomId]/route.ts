import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { getClassroomForUser } from "@/features/classroom/services/classroom-service";
import { AuthError, requireUser } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";
import { getCoverImageMimeType } from "@/lib/storage/cover-image-service";

export const runtime = "nodejs";

/**
 * The one authorized entry point for a classroom's cover banner - same
 * "never expose the raw storage key to the client" convention as the lesson
 * attachment route (/api/files/[id]), reusing getClassroomForUser so cover
 * visibility follows the exact same membership/archived/admin rules as
 * every other classroom read, rather than a second parallel permission check.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  const { classroomId } = await params;

  let user;
  try {
    user = await requireUser();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  try {
    await getClassroomForUser(classroomId, user);
  } catch (error) {
    if (error instanceof ClassroomServiceError) {
      return NextResponse.json({ error: "Classroom not found." }, { status: 404 });
    }
    throw error;
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { coverImageUrl: true },
  });

  if (!classroom?.coverImageUrl) {
    return NextResponse.json({ error: "No cover image." }, { status: 404 });
  }

  const provider = getStorageProvider();
  if (!(await provider.exists(classroom.coverImageUrl))) {
    return NextResponse.json({ error: "Cover image not found in storage." }, { status: 404 });
  }

  const stream = await provider.read(classroom.coverImageUrl);

  return new NextResponse(stream, {
    headers: {
      "Content-Type": getCoverImageMimeType(classroom.coverImageUrl),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
