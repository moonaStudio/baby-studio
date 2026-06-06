import { getSupabaseAdmin } from "./supabaseAdmin";

export type PromoCodeRow = {
  code: string;
  label: string;
  credits: number;
  max_total_redemptions: number | null;
  max_per_user: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
  redemption_count?: number;
};

export type ManualGrantRow = {
  id: string;
  user_id: string;
  grant_id: string;
  credits: number;
  note: string;
  admin_email_hint: string | null;
  created_at: string;
  user_email?: string | null;
};

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export async function lookupUserIdByEmail(email: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(error.message);

  const user = data.users.find((u) => u.email?.toLowerCase() === normalized);
  return user?.id ?? null;
}

export async function grantManualCredit(input: {
  userId: string;
  credits: number;
  note: string;
  adminEmailHint?: string;
}): Promise<{ creditsAdded: number; balance: number; grantId: string }> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("grant_manual_credit", {
    p_user_id: input.userId,
    p_credits: input.credits,
    p_note: input.note,
    p_admin_email_hint: input.adminEmailHint ?? null
  });

  if (error) throw new Error(error.message);
  const row = data as { ok?: boolean; error?: string; credits_added?: number; balance?: number; grant_id?: string };
  if (!row.ok) {
    throw new Error(row.error ?? "grant_failed");
  }
  return {
    creditsAdded: row.credits_added ?? input.credits,
    balance: row.balance ?? 0,
    grantId: row.grant_id ?? ""
  };
}

export async function listPromoCodes(): Promise<PromoCodeRow[]> {
  const admin = getSupabaseAdmin();
  const { data: codes, error } = await admin.from("promo_codes").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const { data: counts, error: countErr } = await admin.from("promo_redemptions").select("promo_code");
  if (countErr) throw new Error(countErr.message);

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    const c = row.promo_code as string;
    countMap.set(c, (countMap.get(c) ?? 0) + 1);
  }

  return (codes ?? []).map((c) => ({
    ...(c as PromoCodeRow),
    redemption_count: countMap.get(c.code) ?? 0
  }));
}

export async function upsertPromoCode(input: {
  code: string;
  label: string;
  credits: number;
  maxTotalRedemptions: number | null;
  maxPerUser: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}): Promise<PromoCodeRow> {
  const admin = getSupabaseAdmin();
  const code = normalizeCode(input.code);
  if (!code) throw new Error("code required");

  const row = {
    code,
    label: input.label.trim(),
    credits: input.credits,
    max_total_redemptions: input.maxTotalRedemptions,
    max_per_user: input.maxPerUser,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    active: input.active
  };

  const { data, error } = await admin.from("promo_codes").upsert(row, { onConflict: "code" }).select("*").single();
  if (error) throw new Error(error.message);
  return data as PromoCodeRow;
}

export async function listRecentManualGrants(limit = 30): Promise<ManualGrantRow[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("manual_credit_grants")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const grants = (data ?? []) as ManualGrantRow[];
  const userIds = [...new Set(grants.map((g) => g.user_id))];
  const emailMap = new Map<string, string | null>();

  for (const uid of userIds) {
    const { data: userData } = await admin.auth.admin.getUserById(uid);
    emailMap.set(uid, userData.user?.email ?? null);
  }

  return grants.map((g) => ({ ...g, user_email: emailMap.get(g.user_id) ?? null }));
}

export async function redeemPromoForUser(code: string, userId: string): Promise<{ creditsAdded: number; code: string }> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc("redeem_promo_code", {
    p_code: normalizeCode(code),
    p_user_id: userId
  });
  if (error) throw new Error(error.message);

  const row = data as { ok?: boolean; error?: string; credits_added?: number; code?: string };
  if (!row.ok) {
    const msg =
      row.error === "not_found"
        ? "코드를 찾을 수 없어요."
        : row.error === "expired"
          ? "만료된 코드예요."
          : row.error === "not_started"
            ? "아직 시작되지 않은 코드예요."
            : row.error === "inactive"
              ? "비활성화된 코드예요."
              : row.error === "already_redeemed"
                ? "이미 사용한 코드예요."
                : row.error === "sold_out"
                  ? "선착순이 마감됐어요."
                  : "코드를 사용할 수 없어요.";
    throw new Error(msg);
  }
  return { creditsAdded: row.credits_added ?? 0, code: row.code ?? normalizeCode(code) };
}

export { normalizeCode };
