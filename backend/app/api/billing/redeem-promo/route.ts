import { NextResponse } from "next/server";
import { getUserIdFromBearer } from "../../../lib/supabaseAuthFromRequest";
import { redeemPromoForUser } from "../../../lib/promoCreditsDb";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const userId = await getUserIdFromBearer(authHeader);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { code?: string };
  try {
    body = (await req.json()) as { code?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  try {
    const result = await redeemPromoForUser(code, userId);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
    let balance = result.creditsAdded;
    if (url && anon && authHeader?.startsWith("Bearer ")) {
      const supabase = createClient(url, anon, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false }
      });
      const { data } = await supabase.from("user_credits").select("credits").eq("user_id", userId).maybeSingle();
      balance = data?.credits ?? balance;
    }

    return NextResponse.json({
      ok: true,
      code: result.code,
      creditsAdded: result.creditsAdded,
      credits: balance
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Redeem failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
