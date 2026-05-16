import { CONFIG } from "../constants/config";

export type ThemePromotionsPayload = {
  month: string;
  monthlyFreeLimit: number;
  premiumBySlug: Record<string, boolean>;
  overrideSlugs?: string[];
};

export async function fetchThemePromotions(month?: string): Promise<ThemePromotionsPayload | null> {
  if (!CONFIG.BACKEND_URL.trim()) {
    return null;
  }
  const base = CONFIG.BACKEND_URL.replace(/\/$/, "");
  const q = month ? `?month=${encodeURIComponent(month)}` : "";
  const res = await fetch(`${base}/api/themes/promotions${q}`);
  if (!res.ok) {
    return null;
  }
  const j = (await res.json()) as ThemePromotionsPayload;
  if (!j.month || typeof j.monthlyFreeLimit !== "number" || !j.premiumBySlug) {
    return null;
  }
  return j;
}
