import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const isLoginPage = request.nextUrl.pathname === "/";
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  // Redirect to login if accessing dashboard without token
  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect to dashboard if accessing login with token
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
