import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/login", "/about"];
const authRoutes = ["/login"];
const adminRoute = "/admin";
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
  const isAuthenticated = Boolean(token);

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
