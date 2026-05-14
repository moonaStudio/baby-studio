import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserIdFromBearer } from "../../../lib/supabaseAuthFromRequest";
import { usageMonthKeySeoul } from "../../../lib/usageMonthKey";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const userId = await getUserIdFromBearer(authHeader);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anon || !authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const month = usageMonthKeySeoul();
  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await supabase
    .from("user_monthly_free_generations")
    .select("generation_count")
    .eq("user_id", userId)
    .eq("usage_month", month)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    used: data?.generation_count ?? 0,
    month
  });
}
