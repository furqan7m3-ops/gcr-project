import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

const publicRoutes = ["/", "/login", "/about"];
const authRoutes = ["/login"];
const adminRoute = "/admin";
const reviewRoute = "/review";
const changePasswordRoute = "/change-password";

export default async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const isPublicRoute = publicRoutes.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith("/api/auth"),
  );
  const isAuthRoute = authRoutes.some((route) => nextUrl.pathname === route);
  const isAdminRoute =
    nextUrl.pathname === adminRoute || nextUrl.pathname.startsWith(`${adminRoute}/`);
  const isChangePasswordRoute = nextUrl.pathname === changePasswordRoute;
  const isAuthApiRoute = nextUrl.pathname.startsWith("/api/auth");

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  let isAuthenticated = Boolean(token);

  // Enforces "Terminate Session" (Phase 13.9): a JWT is otherwise stateless
  // and would keep working until it naturally expires, so every authenticated
  // request re-checks the session row keyed by the token's sessionId and
  // treats a revoked/expired/missing row as if there were no session at all.
  if (isAuthenticated && !isAuthApiRoute && typeof token?.sessionId === "string") {
    const session = await prisma.userLoginSession.findUnique({
      where: { tokenId: token.sessionId },
      select: { revokedAt: true, expiresAt: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // An admin-forced or self-triggered password change takes priority over
  // every other authenticated route, including /admin, until it's resolved.
  // NextAuth's own API routes (session, signout, csrf, ...) must stay reachable
  // regardless, or the change-password page and sign-out itself both break.
  if (isAuthenticated && token?.mustChangePassword && !isChangePasswordRoute && !isAuthApiRoute) {
    return NextResponse.redirect(new URL(changePasswordRoute, request.url));
  }

  if (isAdminRoute && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard?denied=admin", request.url));
  }

  const isReviewRoute =
    nextUrl.pathname === reviewRoute || nextUrl.pathname.startsWith(`${reviewRoute}/`);
  if (isReviewRoute && token?.role !== "TEACHER" && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard?denied=review", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
