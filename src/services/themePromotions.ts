import { CONFIG } from "../constants/config";
import type { RemoteThemeDto } from "../utils/remoteThemeToTemplate";
import { fetchWithTimeout } from "../utils/withTimeout";

export type ThemePromotionsPayload = {
  month: string;
  monthlyFreeLimit: number;
  premiumBySlug: Record<string, boolean>;
  overrideSlugs?: string[];
  remoteThemes?: RemoteThemeDto[];
};

export async function fetchThemePromotions(month?: string): Promise<ThemePromotionsPayload | null> {
  if (!CONFIG.BACKEND_URL.trim()) {
    return null;
  }
  const base = CONFIG.BACKEND_URL.replace(/\/$/, "");
  const q = month ? `?month=${encodeURIComponent(month)}` : "";
  const res = await fetchWithTimeout(`${base}/api/themes/promotions${q}`, undefined, 10_000);
  if (!res.ok) {
    return null;
  }
  const j = (await res.json()) as ThemePromotionsPayload;
  if (!j.month || typeof j.monthlyFreeLimit !== "number" || !j.premiumBySlug) {
    return null;
  }
  return {
    month: j.month,
    monthlyFreeLimit: j.monthlyFreeLimit,
    premiumBySlug: j.premiumBySlug,
    overrideSlugs: j.overrideSlugs,
    remoteThemes: Array.isArray(j.remoteThemes) ? j.remoteThemes : []
  };
}
