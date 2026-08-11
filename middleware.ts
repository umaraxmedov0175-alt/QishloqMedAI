import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_ROLE_COOKIE } from "./lib/demo-session";
import { validateRoleAccess } from "./lib/authorization";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and public auth/login routes bypass middleware
  if (
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest"
  ) {
    return NextResponse.next();
  }

  const roleCookie = request.cookies.get(DEMO_ROLE_COOKIE)?.value;

  // Route alias mappings
  if (pathname.startsWith("/doctor")) {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = pathname.replace(/^\/doctor/, "/central");
    return NextResponse.redirect(targetUrl);
  }
  if (pathname.startsWith("/nurse")) {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = pathname.replace(/^\/nurse/, "/mobile");
    return NextResponse.redirect(targetUrl);
  }
  if (pathname.startsWith("/dispatch") && !pathname.startsWith("/dispatcher")) {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = pathname.replace(/^\/dispatch/, "/dispatcher");
    return NextResponse.redirect(targetUrl);
  }

  // Validate session role boundary
  const access = validateRoleAccess(roleCookie, pathname);

  if (!access.allowed) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = access.redirectTo || "/";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
