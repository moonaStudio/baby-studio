import { getSupabaseAdmin } from "./supabaseAdmin";
import { listAllThemesAdmin, listPublishedThemes } from "./themeCatalogDb";
import { THEME_CATALOG, type ThemeCatalogEntry } from "./themeCatalog";
import type { ThemeCatalogDto } from "./themeTypes";

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

function mergedCatalogEntries(remote: ThemeCatalogDto[]): ThemeCatalogEntry[] {
  const bundledSlugs = new Set(THEME_CATALOG.map((t) => t.slug));
  const extra: ThemeCatalogEntry[] = remote
    .filter((r) => !bundledSlugs.has(r.slug))
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      category: r.category,
      defaultIsPremium: r.defaultIsPremium
    }));
  return [...THEME_CATALOG, ...extra];
}

export function resolveThemesForMonth(
  overrides: Map<string, boolean>,
  remote: ThemeCatalogDto[] = []
): ResolvedThemeRow[] {
  return mergedCatalogEntries(remote).map((entry) => {
    const hasOverride = overrides.has(entry.slug);
    const isPremium = hasOverride ? overrides.get(entry.slug)! : entry.defaultIsPremium;
    return { ...entry, isPremium, hasOverride };
  });
}

export async function getPublicPromotions(promoMonth: string) {
  const overrides = await loadOverrideMap(promoMonth);
  const remote = await listPublishedThemes();
  const themes = resolveThemesForMonth(overrides, remote);
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
    overrideSlugs,
    remoteThemes: remote.map((r) => ({
      slug: r.slug,
      name: r.name,
      category: r.category,
      gender: r.gender,
      defaultIsPremium: r.defaultIsPremium,
      previewUrl: r.previewUrl,
      backgroundUrl: r.backgroundUrl,
      colorProfile: r.colorProfile,
      sortOrder: r.sortOrder
    }))
  };
}

export async function getAdminPromotions(promoMonth: string) {
  const overrides = await loadOverrideMap(promoMonth);
  const remote = await listAllThemesAdmin().catch(() => [] as ThemeCatalogDto[]);
  const themes = resolveThemesForMonth(overrides, remote);
  const monthlyFreeLimit = await getMonthlyFreeLimit();
  return { month: promoMonth, monthlyFreeLimit, themes };
}

export async function saveAdminPromotions(
  promoMonth: string,
  monthlyFreeLimit: number,
  rows: { slug: string; isPremium: boolean }[]
) {
  const admin = getSupabaseAdmin();
  const remote = await listAllThemesAdmin().catch(() => []);
  const known = new Set([...THEME_CATALOG.map((t) => t.slug), ...remote.map((r) => r.slug)]);
  const toSave = rows.filter((r) => known.has(r.slug));

  const { error: delErr } = await admin.from("theme_month_promotions").delete().eq("promo_month", promoMonth);
  if (delErr) throw delErr;

  const catalog = mergedCatalogEntries(remote);
  const inserts = toSave
    .filter((r) => {
      const entry = catalog.find((t) => t.slug === r.slug);
      if (!entry) return false;
      return r.isPremium !== entry.defaultIsPremium;
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
