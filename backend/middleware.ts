import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Site URL fallback (?code= on /) → /auth/callback → babystudio:// */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname !== "/") {
    return NextResponse.next();
  }
  if (!searchParams.get("code") && !searchParams.get("error")) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = "/auth/callback";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: "/"
};
