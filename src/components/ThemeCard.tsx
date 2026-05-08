import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Card, Text, Button } from "react-native-paper";
import { Template } from "../types";
import { PremiumBadge } from "./PremiumBadge";

type Props = {
  template: Template;
  locked: boolean;
  onSelect: () => void;
};

export function ThemeCard({ template, locked, onSelect }: Props) {
  const source = template.previewImage
    ? template.previewImage
    : {
        uri: template.backgroundUrl
      };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.previewWrap}>
          <Image source={source} style={styles.preview} />
        </View>
        <View style={styles.row}>
          <Text variant="titleMedium">{template.name}</Text>
          {template.isPremium && <PremiumBadge />}
        </View>
        <Button mode={locked ? "outlined" : "contained"} onPress={onSelect}>
          {locked ? "프리미엄 보기" : "테마 사용"}
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  previewWrap: {
    width: "100%",
    aspectRatio: 3 / 2,
    borderRadius: 10,
    marginBottom: 8,
    overflow: "hidden",
    backgroundColor: "#F6F6F6"
  },
  preview: { width: "100%", height: "100%", resizeMode: "cover" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }
});
