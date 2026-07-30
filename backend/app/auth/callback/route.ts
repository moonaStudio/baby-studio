import { NextRequest, NextResponse } from "next/server";

/**
 * OAuth lands here with ?code=… (and optional app_return=exp://… or babystudio://…).
 *
 * iOS ASWebAuthenticationSession does not dismiss on HTTPS callbacks without Associated Domains,
 * so we must deep-link back into the app. Expo Go needs exp://; store builds need babystudio://.
 * The app passes that URL as app_return on redirectTo.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const appReturn = req.nextUrl.searchParams.get("app_return");
  const error =
    req.nextUrl.searchParams.get("error_description") ?? req.nextUrl.searchParams.get("error");

  if (error) {
    const html = `<!DOCTYPE html><html><body style="font-family:system-ui;padding:24px">
      <h1>로그인 실패</h1><p>${escapeHtml(error)}</p></body></html>`;
    return new NextResponse(html, {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  if (!code) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const deepLink = buildDeepLink(appReturn, code);

  // HTML + JS redirect — more reliable than HTTP 302 to custom schemes on some clients.
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="0;url=${escapeAttr(deepLink)}" />
  <title>로그인 완료</title>
  <script>location.replace(${JSON.stringify(deepLink)});</script>
</head>
<body style="font-family:system-ui;padding:24px;text-align:center">
  <p>로그인 완료. 앱으로 돌아가는 중…</p>
  <p><a href="${escapeAttr(deepLink)}">앱이 안 열리면 여기를 탭하세요</a></p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function isAllowedAppReturn(url: string): boolean {
  return /^(babystudio|exp|exps):\/\//i.test(url.trim());
}

function appendCode(base: string, code: string): string {
  const cleaned = base.trim().replace(/([?&])code=[^&]*/g, "").replace(/[?&]$/, "");
  const join = cleaned.includes("?") ? "&" : "?";
  return `${cleaned}${join}code=${encodeURIComponent(code)}`;
}

function buildDeepLink(appReturn: string | null, code: string): string {
  if (appReturn && isAllowedAppReturn(appReturn)) {
    return appendCode(appReturn, code);
  }
  // Release / Site URL fallback
  return `babystudio://auth/callback?code=${encodeURIComponent(code)}`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
