import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, isAdminAuthorized } from "../../../lib/adminAuth";
import { listPromoCodes, upsertPromoCode } from "../../../lib/promoCreditsDb";

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse(req);
  try {
    const codes = await listPromoCodes();
    return NextResponse.json({ codes });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load promo codes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse(req);
  try {
    const body = (await req.json()) as {
      code?: string;
      label?: string;
      credits?: number;
      maxTotalRedemptions?: number | null;
      maxPerUser?: number;
      startsAt?: string | null;
      endsAt?: string | null;
      active?: boolean;
    };

    const credits = typeof body.credits === "number" ? Math.floor(body.credits) : 0;
    if (!body.code?.trim() || credits <= 0) {
      return NextResponse.json({ error: "code and credits required" }, { status: 400 });
    }

    const maxPerUser =
      typeof body.maxPerUser === "number" && body.maxPerUser > 0 ? Math.floor(body.maxPerUser) : 1;
    const maxTotal =
      body.maxTotalRedemptions === null || body.maxTotalRedemptions === undefined
        ? null
        : Math.floor(body.maxTotalRedemptions);

    const saved = await upsertPromoCode({
      code: body.code,
      label: body.label ?? "",
      credits,
      maxTotalRedemptions: maxTotal && maxTotal > 0 ? maxTotal : null,
      maxPerUser,
      startsAt: body.startsAt ?? null,
      endsAt: body.endsAt ?? null,
      active: body.active !== false
    });

    return NextResponse.json({ code: saved });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save promo code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
