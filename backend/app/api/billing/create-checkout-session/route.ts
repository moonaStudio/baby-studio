import { NextResponse } from "next/server";
import { getStripe } from "../../../lib/stripeServer";
import { getUserIdFromBearer } from "../../../lib/supabaseAuthFromRequest";
import { createClient } from "@supabase/supabase-js";
import { CREDIT_PACKS, isCreditPackId } from "../../../lib/creditPacks";

export async function POST(req: Request) {
  try {
    const siteUrl = process.env.SITE_URL?.replace(/\/$/, "");
    if (!siteUrl) {
      return NextResponse.json({ error: "SITE_URL is not configured" }, { status: 500 });
    }

    const userId = await getUserIdFromBearer(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as { packId?: string } | null;
    const packId = body?.packId;
    if (!packId || !isCreditPackId(packId)) {
      return NextResponse.json({ error: "Invalid packId" }, { status: 400 });
    }

    const pack = CREDIT_PACKS[packId];
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
    const jwt = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
    let customerEmail: string | undefined;
    if (url && anon && jwt) {
      const supabase = createClient(url, anon);
      const {
        data: { user }
      } = await supabase.auth.getUser(jwt);
      customerEmail = user?.email ?? undefined;
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pack.unitAmount,
            product_data: {
              name: "Baby Studio photo credits",
              description: `${pack.credits} photo credit(s)`
            }
          }
        }
      ],
      metadata: {
        user_id: userId,
        credits: String(pack.credits)
      },
      success_url: `${siteUrl}/billing/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/billing/cancel`
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout session has no URL" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
