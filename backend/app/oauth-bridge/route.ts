import { NextResponse } from "next/server";

/**
 * Supabase OAuth redirect: user lands here as https://…/oauth-bridge?code=…
 * The Expo app reads `result.url` from WebBrowser; no client JS required.
 */
export async function GET() {
  const body = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="font-family:system-ui,sans-serif;padding:24px"><p>로그인 처리 중입니다. 이 창은 닫혀도 됩니다.</p></body></html>`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate"
    }
  });
}
