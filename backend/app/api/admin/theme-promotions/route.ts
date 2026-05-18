import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, isAdminAuthorized } from "../../../lib/adminAuth";
import { usageMonthKeySeoul } from "../../../lib/usageMonthKey";
import { getAdminPromotions, saveAdminPromotions } from "../../../lib/themePromotionsDb";

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse(req);
  try {
    const url = new URL(req.url);
    const monthParam = url.searchParams.get("month");
    const month =
      monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : usageMonthKeySeoul();
    const data = await getAdminPromotions(month);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse(req);
  try {
    const body = (await req.json()) as {
      month?: string;
      monthlyFreeLimit?: number;
      themes?: { slug: string; isPremium: boolean }[];
    };
    const month = body.month && /^\d{4}-\d{2}$/.test(body.month) ? body.month : usageMonthKeySeoul();
    const limit =
      typeof body.monthlyFreeLimit === "number" && body.monthlyFreeLimit >= 0
        ? Math.floor(body.monthlyFreeLimit)
        : 5;
    if (!Array.isArray(body.themes)) {
      return NextResponse.json({ error: "themes array required" }, { status: 400 });
    }
    await saveAdminPromotions(month, limit, body.themes);
    const data = await getAdminPromotions(month);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
