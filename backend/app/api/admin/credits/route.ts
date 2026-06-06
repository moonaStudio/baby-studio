import { NextResponse } from "next/server";
import { adminUnauthorizedResponse, isAdminAuthorized } from "../../../lib/adminAuth";
import {
  grantManualCredit,
  listRecentManualGrants,
  lookupUserIdByEmail
} from "../../../lib/promoCreditsDb";

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse(req);
  try {
    const grants = await listRecentManualGrants();
    return NextResponse.json({ grants });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load grants";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) return adminUnauthorizedResponse(req);
  try {
    const body = (await req.json()) as {
      email?: string;
      userId?: string;
      credits?: number;
      note?: string;
    };

    const credits = typeof body.credits === "number" ? Math.floor(body.credits) : 0;
    if (credits <= 0 || credits > 100) {
      return NextResponse.json({ error: "credits must be 1–100" }, { status: 400 });
    }

    let userId = body.userId?.trim();
    const email = body.email?.trim();
    if (!userId && email) {
      userId = (await lookupUserIdByEmail(email)) ?? undefined;
    }
    if (!userId) {
      return NextResponse.json({ error: "User not found. Check email or user id." }, { status: 404 });
    }

    const note = (body.note ?? "").trim() || "manual admin grant";
    const result = await grantManualCredit({
      userId,
      credits,
      note,
      adminEmailHint: email ?? undefined
    });

    return NextResponse.json({
      ok: true,
      userId,
      email: email ?? null,
      ...result
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Grant failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
