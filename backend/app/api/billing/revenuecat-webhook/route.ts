import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import {
  creditsForStoreProductId,
  isRevenueCatCreditEvent,
  isSupabaseUserId,
  revenueCatGrantId
} from "../../../lib/revenueCatCredits";

export const runtime = "nodejs";

type RevenueCatWebhookBody = {
  event?: {
    type?: string;
    id?: string;
    app_user_id?: string;
    product_id?: string;
  };
};

export async function POST(req: Request) {
  const expectedAuth = process.env.REVENUECAT_WEBHOOK_AUTHORIZATION?.trim();
  if (!expectedAuth) {
    return NextResponse.json({ error: "REVENUECAT_WEBHOOK_AUTHORIZATION is not set" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${expectedAuth}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RevenueCatWebhookBody;
  try {
    body = (await req.json()) as RevenueCatWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event;
  if (!event?.type || !event.id) {
    return NextResponse.json({ received: true, skipped: true });
  }

  if (!isRevenueCatCreditEvent(event.type)) {
    return NextResponse.json({ received: true, skipped: true, reason: event.type });
  }

  const userId = event.app_user_id?.trim();
  const productId = event.product_id?.trim();
  if (!userId || !productId || !isSupabaseUserId(userId)) {
    return NextResponse.json({ received: true, skipped: true, reason: "invalid_user_or_product" });
  }

  const credits = creditsForStoreProductId(productId);
  if (!credits) {
    console.warn("revenuecat webhook unknown product_id", productId);
    return NextResponse.json({ received: true, skipped: true, reason: "unknown_product" });
  }

  const grantId = revenueCatGrantId(event.id);

  try {
    const admin = getSupabaseAdmin();
    const { data: applied, error } = await admin.rpc("apply_checkout_credit", {
      p_checkout_session_id: grantId,
      p_user_id: userId,
      p_credits: credits
    });

    if (error) {
      console.error("apply_checkout_credit rpc error (revenuecat)", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      received: true,
      credited: applied === true,
      duplicate: applied === false
    });
  } catch (e) {
    console.error("revenuecat webhook credit error", e);
    return NextResponse.json({ error: "Credit apply failed" }, { status: 500 });
  }
}
