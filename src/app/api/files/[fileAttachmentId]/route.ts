import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { AuthError, requireUser } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { assertCanAccessFileAttachment } from "@/lib/storage/file-authorization";
import { isLegacyPlaceholder } from "@/lib/storage/file-service";
import { getStorageProvider } from "@/lib/storage";

// Streams real bytes from disk (or, in the future, a cloud SDK's own stream)
// - needs the Node runtime, not the Edge runtime.
export const runtime = "nodejs";

/**
 * The one authorized entry point for viewing/downloading any uploaded file
 * in the app. `?download=1` forces a "Save As" download (Content-Disposition:
 * attachment); the default is `inline`, which lets the browser preview
 * PDFs/images/videos natively and falls back to a download automatically for
 * anything it can't render - no client-side MIME sniffing needed to decide
 * "open vs download", the browser already does that for `inline` responses.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileAttachmentId: string }> },
) {
  const { fileAttachmentId } = await params;

  let user;
  try {
    user = await requireUser();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const attachment = await prisma.fileAttachment.findUnique({
    where: { id: fileAttachmentId },
    include: { file: true },
  });

  if (!attachment) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  try {
    await assertCanAccessFileAttachment(user, attachment);
  } catch (error) {
    if (error instanceof ClassroomServiceError) {
      const status = error.code === "FORBIDDEN" ? 403 : 404;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }

  const { file } = attachment;

  if (isLegacyPlaceholder(file.storagePath)) {
    return NextResponse.json(
      {
        error:
          "This file was uploaded before file storage was enabled and isn't available to open or download.",
      },
      { status: 404 },
    );
  }

  const provider = getStorageProvider();
  if (!(await provider.exists(file.storagePath))) {
    return NextResponse.json({ error: "File not found in storage." }, { status: 404 });
  }

  const stream = await provider.read(file.storagePath);
  const forceDownload = request.nextUrl.searchParams.get("download") === "1";
  const safeFileName = file.fileName.replace(/"/g, "");
  const encodedFileName = encodeURIComponent(file.fileName);

  return new NextResponse(stream, {
    headers: {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Length": String(file.size),
      "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
