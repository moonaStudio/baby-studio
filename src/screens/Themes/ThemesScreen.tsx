import React from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { FilterPill } from "../../components/FilterPill";
import { ScreenHeader } from "../../components/ScreenHeader";
import { ThemeCard } from "../../components/ThemeCard";
import { UI, screenPadding } from "../../constants/ui";
import { useThemes } from "../../hooks/useThemes";
import { useAppStore } from "../../store";
import { canAccessPremiumThemes, effectiveIsPremium, isAuthGateSatisfied } from "../../constants/config";
import { getMonthlyFreeLimit } from "../../constants/monthlyFreeLimit";
import { useRefreshThemePromotionsOnMount } from "../../hooks/useThemes";
import {
  isMonthlyFreeQuotaExhausted,
  monthlyFreeExhaustedMessage,
  MONTHLY_FREE_EXHAUSTED_TITLE
} from "../../constants/monthlyFreeQuota";
import { Template } from "../../types";

type ThemeFilter = "all" | "free" | "newborn" | "summer" | "birthday" | "100day" | "horse";

const FILTER_LABELS: Record<ThemeFilter, string> = {
  all: "전체",
  free: "무료",
  newborn: "신생아",
  summer: "여름",
  birthday: "돌",
  "100day": "100일",
  horse: "말띠"
};

export function ThemesScreen({ navigation }: any) {
  useRefreshThemePromotionsOnMount();
  const [filter, setFilter] = React.useState<ThemeFilter>("free");
  const themes = useThemes();
  const storePremium = useAppStore((s) => s.isPremium);
  const photoCredits = useAppStore((s) => s.photoCredits);
  const isPremium = effectiveIsPremium(storePremium);
  const canAccessPremium = canAccessPremiumThemes(storePremium, photoCredits);
  const monthlyFreeUsed = useAppStore((s) => s.monthlyFreeUsed);
  const selectedGender = useAppStore((s) => s.selectedGender);
  const userId = useAppStore((s) => s.userId);
  const setSelectedGender = useAppStore((s) => s.setSelectedGender);
  const setTheme = useAppStore((s) => s.setTheme);
  const setResultImage = useAppStore((s) => s.setResultImage);

  const filteredThemes = React.useMemo(() => {
    const horseSlugs = new Set(["horse-zodiac-newborn", "horse-plush-newborn", "newborn-horse"]);
    const byCategory =
      filter === "all"
        ? themes
        : filter === "free"
          ? themes.filter((t) => !t.isPremium)
          : filter === "horse"
            ? themes.filter((t) => t.category === "horse" || horseSlugs.has(t.slug))
            : themes.filter((t) => t.category === filter);
    const byGender = byCategory.filter(
      (t) => !selectedGender || t.gender === "unisex" || t.gender === selectedGender
    );
    if (filter === "all") {
      return [...byGender].sort((a, b) => Number(a.isPremium) - Number(b.isPremium));
    }
    return byGender;
  }, [filter, selectedGender, themes]);

  const freeQuotaExhausted = isMonthlyFreeQuotaExhausted(isPremium, monthlyFreeUsed);

  const onSelect = (theme: Template) => {
    if (!theme.isPremium && freeQuotaExhausted) {
      Alert.alert(MONTHLY_FREE_EXHAUSTED_TITLE, monthlyFreeExhaustedMessage(getMonthlyFreeLimit()), [
        { text: "닫기", style: "cancel" },
        { text: "이용권 보기", onPress: () => navigation.navigate("Subscription") }
      ]);
      return;
    }
    if (theme.isPremium && !canAccessPremium) {
      navigation.navigate("Subscription");
      return;
    }
    if (!isAuthGateSatisfied(userId)) {
      navigation.navigate("Login");
      return;
    }
    setResultImage(undefined);
    setTheme(theme);
    navigation.navigate("Create");
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="테마 갤러리"
        subtitle="마음에 드는 스타일을 고르고, 사진 한 장으로 완성해 보세요."
      />

      <Text variant="labelLarge" style={styles.sectionLabel}>
        성별
      </Text>
      <View style={styles.pillRow}>
        <FilterPill label="전체" selected={!selectedGender} onPress={() => setSelectedGender(undefined)} />
        <FilterPill label="여아" selected={selectedGender === "girl"} onPress={() => setSelectedGender("girl")} />
        <FilterPill label="남아" selected={selectedGender === "boy"} onPress={() => setSelectedGender("boy")} />
      </View>

      <Text variant="labelLarge" style={styles.sectionLabel}>
        카테고리
      </Text>
      <View style={styles.pillRowWrap}>
        {(Object.keys(FILTER_LABELS) as ThemeFilter[]).map((key) => (
          <FilterPill
            key={key}
            label={FILTER_LABELS[key]}
            selected={filter === key}
            onPress={() => setFilter(key)}
          />
        ))}
      </View>

      <View style={styles.countRow}>
        <Text variant="titleMedium" style={styles.countTitle}>
          {FILTER_LABELS[filter]}
        </Text>
        <Text variant="bodyMedium" style={styles.countMeta}>
          {filteredThemes.length}개
        </Text>
      </View>

      <View style={styles.grid}>
        {filteredThemes.map((theme) => {
          const premiumLocked = theme.isPremium && !canAccessPremium;
          const monthlyLocked = !theme.isPremium && freeQuotaExhausted;
          return (
            <ThemeCard
              key={theme.slug}
              template={theme}
              locked={premiumLocked || monthlyLocked}
              lockReason={monthlyLocked ? "monthly_free" : "premium"}
              onSelect={() => onSelect(theme)}
              compact
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: UI.bg },
  content: { padding: screenPadding, paddingBottom: 32, gap: 10 },
  sectionLabel: { color: UI.inkSoft, marginTop: 6, fontWeight: "700" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pillRowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 4
  },
  countTitle: { color: UI.ink, fontWeight: "800" },
  countMeta: { color: UI.inkMuted },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between"
  }
});
