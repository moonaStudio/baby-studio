import { getSupabaseAdmin } from "./supabaseAdmin";
import { THEME_CATALOG, type ThemeCatalogEntry } from "./themeCatalog";

const DEFAULT_MONTHLY_FREE_LIMIT = 5;

export type ResolvedThemeRow = ThemeCatalogEntry & {
  isPremium: boolean;
  hasOverride: boolean;
};

export async function getMonthlyFreeLimit(): Promise<number> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("app_config").select("value").eq("key", "monthly_free_limit").maybeSingle();
  if (error) throw error;
  const n = typeof data?.value === "number" ? data.value : Number(data?.value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DEFAULT_MONTHLY_FREE_LIMIT;
}

export async function setMonthlyFreeLimit(limit: number): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("app_config").upsert({
    key: "monthly_free_limit",
    value: limit,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

async function loadOverrideMap(promoMonth: string): Promise<Map<string, boolean>> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("theme_month_promotions")
    .select("theme_slug, is_premium")
    .eq("promo_month", promoMonth);
  if (error) throw error;
  const map = new Map<string, boolean>();
  for (const row of data ?? []) {
    map.set(row.theme_slug, row.is_premium);
  }
  return map;
}

export function resolveThemesForMonth(overrides: Map<string, boolean>): ResolvedThemeRow[] {
  return THEME_CATALOG.map((entry) => {
    const hasOverride = overrides.has(entry.slug);
    const isPremium = hasOverride ? overrides.get(entry.slug)! : entry.defaultIsPremium;
    return { ...entry, isPremium, hasOverride };
  });
}

export async function getPublicPromotions(promoMonth: string) {
  const overrides = await loadOverrideMap(promoMonth);
  const themes = resolveThemesForMonth(overrides);
  const monthlyFreeLimit = await getMonthlyFreeLimit();
  const premiumBySlug: Record<string, boolean> = {};
  const overrideSlugs: string[] = [];
  for (const t of themes) {
    premiumBySlug[t.slug] = t.isPremium;
    if (t.hasOverride) overrideSlugs.push(t.slug);
  }
  return {
    month: promoMonth,
    monthlyFreeLimit,
    premiumBySlug,
    overrideSlugs
  };
}

export async function getAdminPromotions(promoMonth: string) {
  const overrides = await loadOverrideMap(promoMonth);
  const themes = resolveThemesForMonth(overrides);
  const monthlyFreeLimit = await getMonthlyFreeLimit();
  return { month: promoMonth, monthlyFreeLimit, themes };
}

export async function saveAdminPromotions(
  promoMonth: string,
  monthlyFreeLimit: number,
  rows: { slug: string; isPremium: boolean }[]
) {
  const admin = getSupabaseAdmin();
  const known = new Set(THEME_CATALOG.map((t) => t.slug));
  const toSave = rows.filter((r) => known.has(r.slug));

  const { error: delErr } = await admin.from("theme_month_promotions").delete().eq("promo_month", promoMonth);
  if (delErr) throw delErr;

  const inserts = toSave
    .filter((r) => {
      const def = getCatalogEntryOrThrow(r.slug).defaultIsPremium;
      return r.isPremium !== def;
    })
    .map((r) => ({
      promo_month: promoMonth,
      theme_slug: r.slug,
      is_premium: r.isPremium,
      updated_at: new Date().toISOString()
    }));

  if (inserts.length > 0) {
    const { error: insErr } = await admin.from("theme_month_promotions").insert(inserts);
    if (insErr) throw insErr;
  }

  await setMonthlyFreeLimit(monthlyFreeLimit);
}

function getCatalogEntryOrThrow(slug: string) {
  const e = THEME_CATALOG.find((t) => t.slug === slug);
  if (!e) throw new Error(`Unknown theme slug: ${slug}`);
  return e;
}
