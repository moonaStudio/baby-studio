import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Text } from "react-native-paper";
import { ScreenHeader } from "../../components/ScreenHeader";
import { UI, cardBase, screenPadding } from "../../constants/ui";
import { useAppStore } from "../../store";

export function CreateSourceScreen({ navigation }: any) {
  const selectedTheme = useAppStore((s) => s.selectedTheme);

  useFocusEffect(
    useCallback(() => {
      if (!selectedTheme) {
        navigation.navigate("Theme");
      }
    }, [navigation, selectedTheme])
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="사진 선택" subtitle="선택한 테마에 맞는 사진을 골라 주세요." />

      <View style={styles.themeCard}>
        <Text variant="labelMedium" style={styles.themeLabel}>
          선택된 테마
        </Text>
        <Text variant="titleLarge" style={styles.themeName}>
          {selectedTheme?.name ?? "불러오는 중…"}
        </Text>
        {selectedTheme?.previewImage ? (
          <Image source={selectedTheme.previewImage} style={styles.themePreview} resizeMode="cover" />
        ) : null}
      </View>

      <View style={styles.optionCard}>
        <View style={styles.optionIconWrap}>
          <MaterialCommunityIcons name="camera-outline" size={26} color={UI.primaryDark} />
        </View>
        <View style={styles.optionBody}>
          <Text variant="titleMedium" style={styles.optionTitle}>
            지금 촬영하기
          </Text>
          <Text style={styles.optionDesc}>밝은 곳에서 얼굴이 중앙에 오게 찍으면 가장 잘 나와요.</Text>
        </View>
        <Button mode="contained" style={styles.optionBtn} onPress={() => navigation.navigate("CameraCapture")}>
          촬영
        </Button>
      </View>

      <View style={styles.optionCardAlt}>
        <View style={[styles.optionIconWrap, styles.optionIconAlt]}>
          <MaterialCommunityIcons name="image-outline" size={26} color={UI.secondary} />
        </View>
        <View style={styles.optionBody}>
          <Text variant="titleMedium" style={styles.optionTitle}>
            보관함에서 고르기
          </Text>
          <Text style={styles.optionDesc}>이미 있는 사진 중 표정이 잘 나온 컷으로 시작할 수 있어요.</Text>
        </View>
        <Button mode="contained-tonal" style={styles.optionBtn} onPress={() => navigation.navigate("UploadPick")}>
          선택
        </Button>
      </View>

      <View style={styles.tips}>
        <Text variant="labelLarge" style={styles.tipsTitle}>
          좋은 결과를 위한 팁
        </Text>
        <Text style={styles.tip}>· 얼굴이 또렷하고 정면에 가까운 사진</Text>
        <Text style={styles.tip}>· 강한 역광·어두운 사진은 피하기</Text>
        <Text style={styles.tip}>· 모자·손·스티커로 얼굴이 가려지지 않게</Text>
      </View>

      <Button mode="text" textColor={UI.primaryDark} onPress={() => navigation.navigate("Theme")}>
        테마 다시 고르기
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: UI.bg },
  content: { padding: screenPadding, paddingBottom: 28, gap: 14 },
  themeCard: {
    ...cardBase,
    backgroundColor: UI.primarySoft,
    borderColor: UI.borderStrong,
    padding: 16,
    gap: 8
  },
  themeLabel: { color: UI.primaryDark, fontWeight: "700" },
  themeName: { color: UI.ink, fontWeight: "800" },
  themePreview: { width: "100%", height: 160, borderRadius: 14, marginTop: 4 },
  optionCard: {
    ...cardBase,
    padding: 16,
    gap: 12,
    borderColor: "#DDA3CC"
  },
  optionCardAlt: {
    ...cardBase,
    padding: 16,
    gap: 12,
    borderColor: "#D7C6FA"
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: UI.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  optionIconAlt: { backgroundColor: UI.secondarySoft },
  optionBody: { gap: 4 },
  optionTitle: { color: UI.ink, fontWeight: "700" },
  optionDesc: { color: UI.inkMuted, lineHeight: 20 },
  optionBtn: { alignSelf: "flex-start", borderRadius: 12 },
  tips: {
    backgroundColor: UI.bgSoft,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: UI.border
  },
  tipsTitle: { color: UI.primaryDark, fontWeight: "700", marginBottom: 4 },
  tip: { color: UI.inkMuted, lineHeight: 20 }
});
