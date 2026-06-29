import React from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Button, IconButton, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { UI, cardBase, cardShadow, screenPadding } from "../../constants/ui";
import { useThemes } from "../../hooks/useThemes";
import { useMonthlyFreeLimit } from "../../hooks/useMonthlyFreeLimit";
import { Template } from "../../types";

import ExampleAfter1 from "../../../assets/example/after_1.png";
import ExampleAfter2 from "../../../assets/example/after_2.png";
import ExampleBefore1 from "../../../assets/example/before_1.png";
import ExampleBefore2 from "../../../assets/example/before_2.png";

const EXAMPLE_PAIRS = [
  { before: ExampleBefore1, after: ExampleAfter1 },
  { before: ExampleBefore2, after: ExampleAfter2 }
] as const;

function homeFreeThemeLabel(theme: Template): string {
  if (theme.slug === "100-days-hanbok") return "100일 한복 여아";
  if (theme.slug === "100-days-hanbok-boy") return "100일 한복 남아";
  return theme.name;
}

export function HomeScreen({ navigation }: any) {
  const monthlyFreeLimit = useMonthlyFreeLimit();
  const themes = useThemes();
  const freeThemes = themes.filter((theme) => !theme.isPremium).slice(0, 4);
  const [exampleIndex, setExampleIndex] = React.useState(0);

  const EXAMPLE_COUNT = EXAMPLE_PAIRS.length;
  const goPrevExample = () =>
    setExampleIndex((prev) => (prev - 1 + EXAMPLE_COUNT) % EXAMPLE_COUNT);
  const goNextExample = () => setExampleIndex((prev) => (prev + 1) % EXAMPLE_COUNT);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <View>
          <Text variant="labelMedium" style={styles.kicker}>
            Moona Studio
          </Text>
          <Text variant="headlineSmall" style={styles.headline}>
            우리 아기{"\n"}스튜디오 감성 사진
          </Text>
        </View>
        <IconButton
          icon="account-circle-outline"
          iconColor={UI.primaryDark}
          size={28}
          onPress={() => navigation.navigate("You")}
        />
      </View>

      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <MaterialCommunityIcons name="star-four-points-outline" size={16} color={UI.primaryDark} />
          <Text variant="labelMedium" style={styles.heroBadgeText}>
            AI 얼굴 합성
          </Text>
        </View>
        <Text variant="bodyLarge" style={styles.heroBody}>
          사진 한 장으로 100일·돌·여름 테마까지 자연스럽게 완성해요.
        </Text>
        <View style={styles.statRow}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{monthlyFreeLimit}</Text>
            <Text style={styles.statLabel}>무료/월</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{themes.length}</Text>
            <Text style={styles.statLabel}>테마</Text>
          </View>
        </View>
        <Button
          mode="contained"
          contentStyle={styles.ctaContent}
          style={styles.cta}
          onPress={() => navigation.navigate("Theme")}
        >
          테마 고르고 시작하기
        </Button>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Before / After
          </Text>
          <View style={styles.sectionActions}>
            <IconButton icon="chevron-left" size={20} onPress={goPrevExample} iconColor={UI.primaryDark} />
            <Text variant="bodySmall" style={styles.sectionMeta}>
              {exampleIndex + 1}/{EXAMPLE_COUNT}
            </Text>
            <IconButton icon="chevron-right" size={20} onPress={goNextExample} iconColor={UI.primaryDark} />
          </View>
        </View>
        <View style={styles.compareRow}>
          <View style={styles.compareCard}>
            <Image source={EXAMPLE_PAIRS[exampleIndex].before} style={styles.compareImage} />
            <View style={styles.compareTag}>
              <Text style={styles.compareTagText}>원본</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={20} color={UI.primary} style={styles.arrow} />
          <View style={[styles.compareCard, styles.compareCardAfter]}>
            <Image source={EXAMPLE_PAIRS[exampleIndex].after} style={styles.compareImage} />
            <View style={[styles.compareTag, styles.compareTagAfter]}>
              <Text style={styles.compareTagText}>결과</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          무료로 시작하기
        </Text>
        <View style={styles.freeList}>
          {freeThemes.map((theme) => (
            <View key={theme.slug} style={styles.freeItem}>
              <MaterialCommunityIcons name="flower-tulip-outline" size={18} color={UI.primary} />
              <Text style={styles.freeItemText}>{homeFreeThemeLabel(theme)}</Text>
            </View>
          ))}
        </View>
        <Button mode="outlined" style={styles.secondaryCta} onPress={() => navigation.navigate("Theme")}>
          모든 테마 보기
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: UI.bg },
  content: { padding: screenPadding, paddingBottom: 28, gap: 18 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  kicker: { color: UI.primaryDark, fontWeight: "700", letterSpacing: 0.4 },
  headline: { color: UI.ink, fontWeight: "800", marginTop: 2, lineHeight: 32 },
  hero: {
    ...cardBase,
    backgroundColor: UI.primarySoft,
    borderColor: UI.borderStrong,
    padding: 18,
    gap: 12
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFFAA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  heroBadgeText: { color: UI.primaryDark, fontWeight: "700" },
  heroBody: { color: UI.inkSoft, lineHeight: 24 },
  statRow: { flexDirection: "row", gap: 10 },
  statChip: {
    flex: 1,
    backgroundColor: "#FFFFFFCC",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center"
  },
  statValue: { color: UI.ink, fontSize: 20, fontWeight: "800" },
  statLabel: { color: UI.inkMuted, fontSize: 12, marginTop: 2 },
  cta: { borderRadius: 14, marginTop: 4 },
  ctaContent: { paddingVertical: 6 },
  section: { gap: 12 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sectionTitle: { color: UI.ink, fontWeight: "800" },
  sectionActions: { flexDirection: "row", alignItems: "center" },
  sectionMeta: { color: UI.inkMuted, minWidth: 28, textAlign: "center" },
  compareRow: { flexDirection: "row", alignItems: "center" },
  compareCard: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: UI.bgSoft,
    borderWidth: 1,
    borderColor: UI.border,
    ...cardShadow
  },
  compareCardAfter: { borderColor: "#D7C6FA" },
  compareImage: { width: "100%", height: "100%" },
  compareTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#FFFFFFDD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999
  },
  compareTagAfter: { backgroundColor: "#ECE6FFEE" },
  compareTagText: { color: UI.ink, fontSize: 11, fontWeight: "700" },
  arrow: { marginHorizontal: 4 },
  freeList: { gap: 10 },
  freeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: UI.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: UI.border
  },
  freeItemText: { color: UI.inkSoft, flex: 1, fontWeight: "600" },
  secondaryCta: { borderRadius: 14, borderColor: UI.borderStrong }
});
