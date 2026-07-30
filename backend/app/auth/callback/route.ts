import { NextRequest, NextResponse } from "next/server";

/**
 * OAuth lands here with ?code=…
 *
 * Do NOT 302 to babystudio:// — that breaks Expo Go (Safari: "address is invalid")
 * and can race ASWebAuthenticationSession before the HTTPS URL is captured.
 *
 * The app opens auth with return URL prefix = this backend host, so when this
 * page loads the in-app browser closes and the app reads `code` from the URL.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error =
    req.nextUrl.searchParams.get("error_description") ?? req.nextUrl.searchParams.get("error");

  if (error) {
    const html = `<!DOCTYPE html><html><body style="font-family:system-ui;padding:24px">
      <h1>로그인 실패</h1><p>${escapeHtml(error)}</p></body></html>`;
    return new NextResponse(html, { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (!code) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>로그인 완료</title>
</head>
<body style="font-family:system-ui;padding:24px;text-align:center">
  <p>로그인 완료. 앱으로 돌아가는 중…</p>
  <p style="color:#888;font-size:14px">이 창이 자동으로 닫히지 않으면 직접 닫아 주세요.</p>
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

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
