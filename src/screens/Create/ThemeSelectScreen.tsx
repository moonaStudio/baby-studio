import React from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";
import { ThemeGrid } from "../../components/ThemeGrid";
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

export function ThemeSelectScreen({ navigation }: any) {
  useRefreshThemePromotionsOnMount();
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

  const visibleThemes = themes.filter(
    (theme) => !selectedGender || theme.gender === "unisex" || theme.gender === selectedGender
  );
  const freeThemes = visibleThemes.filter((theme) => !theme.isPremium);
  const premiumThemes = visibleThemes.filter((theme) => theme.isPremium);
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
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="headlineSmall">테마 갤러리</Text>
      <Text>
        선택 성별: {selectedGender === "girl" ? "여아" : selectedGender === "boy" ? "남아" : "전체"}. 현재는 얼굴 합성만 지원해요.
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip selected={!selectedGender} onPress={() => setSelectedGender(undefined)}>
          전체
        </Chip>
        <Chip selected={selectedGender === "girl"} onPress={() => setSelectedGender("girl")}>
          여아
        </Chip>
        <Chip selected={selectedGender === "boy"} onPress={() => setSelectedGender("boy")}>
          남아
        </Chip>
      </View>

      <View style={{ gap: 6 }}>
        <Text variant="titleMedium">무료 ({freeThemes.length})</Text>
        <ThemeGrid themes={freeThemes} canAccessPremium={canAccessPremium} freeQuotaExhausted={freeQuotaExhausted} onSelect={onSelect} />
      </View>

      <View style={{ gap: 6 }}>
        <Text variant="titleMedium">프리미엄 ({premiumThemes.length})</Text>
        <ThemeGrid themes={premiumThemes} canAccessPremium={canAccessPremium} onSelect={onSelect} />
      </View>

      <Card>
        <Card.Content>
          <Button mode="outlined" onPress={() => navigation.navigate("Create")}>
            원본 선택으로 돌아가기
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
