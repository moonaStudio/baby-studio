import { NextResponse } from "next/server";
import { usageMonthKeySeoul } from "../../../lib/usageMonthKey";
import { getPublicPromotions } from "../../../lib/themePromotionsDb";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const monthParam = url.searchParams.get("month");
    const month =
      monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : usageMonthKeySeoul();
    const data = await getPublicPromotions(month);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load promotions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
