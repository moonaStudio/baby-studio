import { useEffect, useMemo, useState } from "react";
import { THEME_TEMPLATES } from "../constants/themes";
import { fetchThemePromotions } from "../services/themePromotions";
import { useAppStore } from "../store";
import { Template } from "../types";
import { mergeTemplatesWithPromotions } from "../utils/mergeThemePromotions";

export function useThemes(): Template[] {
  const themePromotions = useAppStore((s) => s.themePromotions);
  return useMemo(
    () => mergeTemplatesWithPromotions(THEME_TEMPLATES, themePromotions ?? null),
    [themePromotions]
  );
}

/** 앱 시작·테마 탭 진입 시 호출 */
export async function refreshThemePromotionsFromServer(): Promise<void> {
  const data = await fetchThemePromotions();
  if (!data) return;
  useAppStore.getState().setThemePromotions({
    month: data.month,
    monthlyFreeLimit: data.monthlyFreeLimit,
    premiumBySlug: data.premiumBySlug
  });
}

/** 테마 화면에서 최신 설정을 다시 받을 때 */
export function useRefreshThemePromotionsOnMount() {
  const [, bump] = useState(0);
  useEffect(() => {
    void refreshThemePromotionsFromServer().then(() => bump((n) => n + 1));
  }, []);
}
