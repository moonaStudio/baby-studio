import { Template } from "../types";
import type { ThemePromotionsPayload } from "../services/themePromotions";

/** Apply server monthly flags onto local templates (preview assets stay local). */
export function mergeTemplatesWithPromotions(
  templates: Template[],
  promotions: ThemePromotionsPayload | null | undefined
): Template[] {
  if (!promotions?.premiumBySlug) {
    return templates;
  }
  return templates.map((t) => {
    const remote = promotions.premiumBySlug[t.slug];
    if (typeof remote !== "boolean") {
      return t;
    }
    if (remote === t.isPremium) {
      return t;
    }
    return { ...t, isPremium: remote };
  });
}
