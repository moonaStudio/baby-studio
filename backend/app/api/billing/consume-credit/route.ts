import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await supabase.rpc("consume_one_photo_credit");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const credits = typeof data === "number" ? data : Number(data);
  if (!Number.isFinite(credits)) {
    return NextResponse.json({ error: "Invalid response" }, { status: 500 });
  }
  if (credits < 0) {
    return NextResponse.json({ error: "Insufficient credits", credits: 0 }, { status: 402 });
  }

  return NextResponse.json({ credits });
}
