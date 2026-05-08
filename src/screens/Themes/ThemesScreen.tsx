import React from "react";
import { ScrollView, View } from "react-native";
import { Chip, Text } from "react-native-paper";
import { ThemeCard } from "../../components/ThemeCard";
import { useThemes } from "../../hooks/useThemes";
import { useAppStore } from "../../store";
import { CONFIG, effectiveIsPremium, isAuthGateSatisfied } from "../../constants/config";
import { Template } from "../../types";

type ThemeFilter = "all" | "free" | "newborn" | "months" | "birthday" | "100day" | "horse";

const FILTER_LABELS: Record<ThemeFilter, string> = {
  all: "전체 카테고리",
  free: "무료",
  newborn: "신생아",
  months: "월별",
  birthday: "돌사진",
  "100day": "100일",
  horse: "말띠"
};

export function ThemesScreen({ navigation }: any) {
  const [filter, setFilter] = React.useState<ThemeFilter>("free");
  const themes = useThemes();
  const storePremium = useAppStore((s) => s.isPremium);
  const isPremium = effectiveIsPremium(storePremium);
  const monthlyFreeCount = useAppStore((s) => s.monthlyFreeCount);
  const selectedGender = useAppStore((s) => s.selectedGender);
  const selectedTheme = useAppStore((s) => s.selectedTheme);
  const userId = useAppStore((s) => s.userId);
  const setSelectedGender = useAppStore((s) => s.setSelectedGender);
  const setTheme = useAppStore((s) => s.setTheme);
  const setSelectedImage = useAppStore((s) => s.setSelectedImage);
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

  const onSelect = (theme: Template) => {
    const isThemeChanged = selectedTheme?.slug !== theme.slug;
    if (isThemeChanged) {
      // Prevent previous theme's photo/result from being reused accidentally.
      setSelectedImage(undefined);
      setResultImage(undefined);
    }
    setTheme(theme);
    if (!isPremium && monthlyFreeCount >= CONFIG.FREE_MONTHLY_LIMIT) {
      navigation.navigate("Subscription");
      return;
    }
    if (theme.isPremium && !isPremium) {
      navigation.navigate("Subscription");
      return;
    }
    const hasImage = Boolean(useAppStore.getState().selectedImageUri);
    if (hasImage && !isAuthGateSatisfied(userId)) {
      navigation.navigate("Login");
      return;
    }
    navigation.navigate(hasImage ? "Processing" : "Create");
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <Text variant="headlineSmall">테마</Text>
      <Text>카테고리별로 원하는 테마를 선택하세요.</Text>
      <Text variant="labelLarge">성별 필터</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip selected={!selectedGender} onPress={() => setSelectedGender(undefined)}>
          성별 전체
        </Chip>
        <Chip selected={selectedGender === "girl"} onPress={() => setSelectedGender("girl")}>
          여아
        </Chip>
        <Chip selected={selectedGender === "boy"} onPress={() => setSelectedGender("boy")}>
          남아
        </Chip>
      </View>

      <Text variant="labelLarge">카테고리 필터</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(Object.keys(FILTER_LABELS) as ThemeFilter[]).map((key) => (
          <Chip key={key} selected={filter === key} onPress={() => setFilter(key)}>
            {FILTER_LABELS[key]}
          </Chip>
        ))}
      </View>

      <Text variant="titleMedium">
        {FILTER_LABELS[filter]} ({filteredThemes.length})
      </Text>

      {filteredThemes.map((theme) => (
        <ThemeCard
          key={theme.slug}
          template={theme}
          locked={theme.isPremium && !isPremium}
          onSelect={() => onSelect(theme)}
        />
      ))}
    </ScrollView>
  );
}
