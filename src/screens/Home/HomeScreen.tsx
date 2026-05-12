import React from "react";
import { Image, ScrollView, View } from "react-native";
import { Button, Card, Chip, IconButton, Text } from "react-native-paper";
import { useThemes } from "../../hooks/useThemes";
import { CONFIG } from "../../constants/config";
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
  const monthGirl = theme.slug.match(/^month-(\d{2})-milestone-girl$/);
  if (monthGirl) return `${parseInt(monthGirl[1], 10)}월 여아 아기 테마`;
  const monthBoy = theme.slug.match(/^month-(\d{2})-milestone-boy$/);
  if (monthBoy) return `${parseInt(monthBoy[1], 10)}월 남아 아기 테마`;
  if (theme.slug === "month-01-milestone") return "1월 아기 테마";
  if (theme.slug === "100-days-hanbok") return "100일 한복 여아 테마";
  if (theme.slug === "100-days-hanbok-boy") return "100일 한복 남아 테마";
  return `${theme.name} 테마`;
}

export function HomeScreen({ navigation }: any) {
  const themes = useThemes();
  const freeThemes = themes.filter((theme) => !theme.isPremium).slice(0, 3);
  const [exampleIndex, setExampleIndex] = React.useState(0);

  const EXAMPLE_COUNT = EXAMPLE_PAIRS.length;
  const goPrevExample = () =>
    setExampleIndex((prev) => (prev - 1 + EXAMPLE_COUNT) % EXAMPLE_COUNT);
  const goNextExample = () => setExampleIndex((prev) => (prev + 1) % EXAMPLE_COUNT);

  return (
    <ScrollView
      style={{ backgroundColor: "#FFF9FD" }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 16,
        gap: 12,
        backgroundColor: "#FFF9FD"
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 6,
          borderBottomWidth: 1,
          borderBottomColor: "#F0E4EF"
        }}
      >
        <Text
          variant="titleLarge"
          style={{ color: "#4C113F", fontWeight: "800", fontFamily: "System" }}
        >
          Moona Studio
        </Text>
        <IconButton
          icon="account-circle-outline"
          iconColor="#A24A8C"
          accessibilityLabel="내 정보"
          onPress={() => navigation.navigate("You")}
        />
      </View>

      <Card style={{ backgroundColor: "#FFEAF7" }}>
        <Card.Content style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ gap: 4 }}>
              <Text variant="labelMedium" style={{ color: "#8A3C75" }}>
                오늘의 추천
              </Text>
              <Text variant="headlineSmall" style={{ color: "#4C113F", fontWeight: "800" }}>
                지금 바로 성장사진 만들기
              </Text>
            </View>
            <IconButton icon="sparkles-outline" iconColor="#C05DA5" />
          </View>

          <Text style={{ color: "#6A2A56" }}>
            사진 한 장으로 자연스러운 감성 테마를 빠르게 만들어보세요.
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Chip compact icon="gift-outline">
              무료 {CONFIG.FREE_MONTHLY_LIMIT}장/월
            </Chip>
            <Chip compact icon="palette-outline">
              테마 {themes.length}개
            </Chip>
          </View>

          <Text variant="bodySmall" style={{ color: "#8A5A7B" }}>
            먼저 하단의 「테마」에서 마음에 드는 스타일을 고른 뒤, 사진을 선택해 주세요.
          </Text>
        </Card.Content>
      </Card>

      <Card style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EFDCEE" }}>
        <Card.Content style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ gap: 2, flex: 1, paddingRight: 8 }}>
              <Text variant="titleMedium" style={{ color: "#4C113F", fontWeight: "700" }}>
                실제 결과 미리보기
              </Text>
              <Text variant="bodySmall" style={{ color: "#8A5A7B" }}>
                {`예시 ${exampleIndex + 1} / ${EXAMPLE_COUNT}`}
              </Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <IconButton
                icon="chevron-left"
                size={20}
                iconColor="#A24A8C"
                disabled={EXAMPLE_COUNT <= 1}
                onPress={goPrevExample}
              />
              <IconButton
                icon="chevron-right"
                size={20}
                iconColor="#A24A8C"
                disabled={EXAMPLE_COUNT <= 1}
                onPress={goNextExample}
              />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                flex: 1,
                aspectRatio: 3 / 4,
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: "#FFF2F8",
                borderWidth: 1,
                borderColor: "#F1D7E8"
              }}
            >
              <Image
                source={EXAMPLE_PAIRS[exampleIndex].before}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <View style={{ position: "absolute", top: 8, left: 8 }}>
                <Chip compact>원본</Chip>
              </View>
            </View>
            <View
              style={{
                flex: 1,
                aspectRatio: 3 / 4,
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: "#F4EEFF",
                borderWidth: 1,
                borderColor: "#E5D9FB"
              }}
            >
              <Image
                source={EXAMPLE_PAIRS[exampleIndex].after}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <View style={{ position: "absolute", top: 8, left: 8 }}>
                <Chip compact>결과</Chip>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={{ gap: 8 }}>
        <Text variant="titleMedium" style={{ color: "#4C113F", fontWeight: "700" }}>
          무료 테마로 시작하기
        </Text>
        <Card style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EFDCEE" }}>
          <Card.Content style={{ gap: 8 }}>
            {freeThemes.map((theme) => (
              <Text key={theme.slug} style={{ color: "#6A2A56" }}>
                - {homeFreeThemeLabel(theme)}
              </Text>
            ))}
            <Text variant="bodySmall" style={{ color: "#8A5A7B" }}>
              아래에서 테마를 고르면 이어서 사진을 선택할 수 있어요.
            </Text>
            <Button mode="contained-tonal" onPress={() => navigation.navigate("Theme")}>
              테마 고르기
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}
