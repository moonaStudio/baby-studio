import { NextRequest, NextResponse } from "next/server";

const APP_SCHEME = "babystudio";

/** OAuth return: HTTP 302 → app deep link so the in-app browser closes on Android. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error =
    req.nextUrl.searchParams.get("error_description") ?? req.nextUrl.searchParams.get("error");

  if (error) {
    const html = `<!DOCTYPE html><html><body style="font-family:system-ui;padding:24px">
      <h1>로그인 실패</h1><p>${error}</p></body></html>`;
    return new NextResponse(html, { status: 400, headers: { "Content-Type": "text/html" } });
  }

  if (!code) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const deepLink = `${APP_SCHEME}://auth/callback?code=${encodeURIComponent(code)}`;
  return NextResponse.redirect(deepLink);
}
