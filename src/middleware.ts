import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/login", "/register", "/about"];
const authRoutes = ["/login", "/register"];

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const isPublicRoute = publicRoutes.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith("/api/auth"),
  );
  const isAuthRoute = authRoutes.some((route) => nextUrl.pathname === route);

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  const isAuthenticated = Boolean(token);

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
