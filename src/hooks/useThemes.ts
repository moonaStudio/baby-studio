import { useEffect, useMemo, useState } from "react";
import { THEME_TEMPLATES } from "../constants/themes";
import { fetchThemePromotions } from "../services/themePromotions";
import { useAppStore } from "../store";
import { Template } from "../types";
import { mergeTemplatesWithPromotions } from "../utils/mergeThemePromotions";
import { remoteThemeToTemplate } from "../utils/remoteThemeToTemplate";

export function useThemes(): Template[] {
  const themePromotions = useAppStore((s) => s.themePromotions);
  return useMemo(() => {
    let list = mergeTemplatesWithPromotions(THEME_TEMPLATES, themePromotions ?? null);
    const remote = themePromotions?.remoteThemes ?? [];
    const slugs = new Set(list.map((t) => t.slug));
    const premiumBySlug = themePromotions?.premiumBySlug ?? {};
    for (const r of remote) {
      if (slugs.has(r.slug)) continue;
      const isPremium =
        typeof premiumBySlug[r.slug] === "boolean" ? premiumBySlug[r.slug] : r.defaultIsPremium;
      list = [...list, remoteThemeToTemplate(r, isPremium)];
      slugs.add(r.slug);
    }
    return list;
  }, [themePromotions]);
}

/** 앱 시작·테마 탭 진입 시 호출 */
export async function refreshThemePromotionsFromServer(): Promise<void> {
  const data = await fetchThemePromotions();
  if (!data) return;
  useAppStore.getState().setThemePromotions({
    month: data.month,
    monthlyFreeLimit: data.monthlyFreeLimit,
    premiumBySlug: data.premiumBySlug,
    remoteThemes: data.remoteThemes ?? []
  });
}

/** 테마 화면에서 최신 설정을 다시 받을 때 */
export function useRefreshThemePromotionsOnMount() {
  const [, bump] = useState(0);
  useEffect(() => {
    void refreshThemePromotionsFromServer().then(() => bump((n) => n + 1));
  }, []);
}
