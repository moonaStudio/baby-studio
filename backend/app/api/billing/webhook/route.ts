import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "../../../lib/stripeServer";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not set" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const creditsRaw = session.metadata?.credits;
    const credits = creditsRaw ? parseInt(creditsRaw, 10) : NaN;
    const checkoutSessionId = session.id;

    if (!userId || !checkoutSessionId || !Number.isFinite(credits) || credits <= 0) {
      return NextResponse.json({ received: true, skipped: true });
    }

    try {
      const admin = getSupabaseAdmin();
      const { data: applied, error } = await admin.rpc("apply_checkout_credit", {
        p_checkout_session_id: checkoutSessionId,
        p_user_id: userId,
        p_credits: credits
      });

      if (error) {
        console.error("apply_checkout_credit rpc error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (applied === false) {
        return NextResponse.json({ received: true, duplicate: true });
      }
    } catch (e) {
      console.error("webhook credit error", e);
      return NextResponse.json({ error: "Credit apply failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
