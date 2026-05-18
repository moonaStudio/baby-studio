import { NextResponse } from "next/server";

/** 어드민 설정 여부만 확인 (비밀번호 노출 없음). */
export async function GET() {
  const configured = Boolean(process.env.ADMIN_SECRET?.trim());
  return NextResponse.json({
    adminConfigured: configured,
    hint: configured
      ? "ADMIN_SECRET is set on this deployment. Use the same value in /admin/themes."
      : "Add ADMIN_SECRET in Vercel → Settings → Environment Variables → Production, then Redeploy."
  });
}
