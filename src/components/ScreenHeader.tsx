import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { UI } from "../constants/ui";

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, right }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.textBlock}>
        <Text variant="headlineSmall" style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodyMedium" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 4
  },
  textBlock: { flex: 1, gap: 4 },
  title: { color: UI.ink, fontWeight: "800" },
  subtitle: { color: UI.inkMuted, lineHeight: 20 },
  right: { paddingTop: 2 }
});
