import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";
import { UI, cardBase } from "../constants/ui";
import { Template } from "../types";

type Props = {
  template: Template;
  locked: boolean;
  lockReason?: "premium" | "monthly_free";
  onSelect: () => void;
  compact?: boolean;
};

export function ThemeCard({ template, locked, lockReason = "premium", onSelect, compact }: Props) {
  const source = template.previewImage ? template.previewImage : { uri: template.backgroundUrl };

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        pressed && styles.cardPressed
      ]}
    >
      <View style={styles.previewWrap}>
        <Image source={source} style={styles.preview} />
        {locked ? (
          <View style={styles.lockOverlay}>
            <MaterialCommunityIcons
              name={lockReason === "monthly_free" ? "calendar-remove" : "lock-outline"}
              size={22}
              color="#FFFFFF"
            />
          </View>
        ) : null}
        {template.isPremium ? (
          <View style={styles.premiumTag}>
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        ) : (
          <View style={styles.freeTag}>
            <Text style={styles.freeText}>FREE</Text>
          </View>
        )}
      </View>
      <View style={styles.meta}>
        <Text variant={compact ? "titleSmall" : "titleMedium"} style={styles.name} numberOfLines={2}>
          {template.name}
        </Text>
        <Text variant="bodySmall" style={styles.hint}>
          {locked
            ? lockReason === "monthly_free"
              ? "이번 달 한도 도달"
              : "이용권 필요"
            : "탭해서 시작"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardBase,
    marginBottom: 14
  },
  cardCompact: {
    flex: 1,
    minWidth: "47%",
    maxWidth: "48%",
    marginBottom: 0
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  previewWrap: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: UI.bgSoft,
    position: "relative"
  },
  preview: { width: "100%", height: "100%", resizeMode: "cover" },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(76, 17, 63, 0.42)",
    alignItems: "center",
    justifyContent: "center"
  },
  premiumTag: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(140, 121, 217, 0.92)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999
  },
  premiumText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6
  },
  freeTag: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(104, 184, 166, 0.92)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999
  },
  freeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6
  },
  meta: { padding: 12, gap: 4 },
  name: { color: UI.ink, fontWeight: "700" },
  hint: { color: UI.inkMuted }
});
