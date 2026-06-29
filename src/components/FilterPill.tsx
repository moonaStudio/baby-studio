import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { UI } from "../constants/ui";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function FilterPill({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, selected ? styles.pillSelected : styles.pillDefault]}
    >
      <Text variant="labelLarge" style={[styles.label, selected ? styles.labelSelected : undefined]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1
  },
  pillDefault: {
    backgroundColor: UI.surface,
    borderColor: UI.border
  },
  pillSelected: {
    backgroundColor: UI.primarySoft,
    borderColor: UI.primary
  },
  label: { color: UI.inkSoft },
  labelSelected: { color: UI.primaryDark, fontWeight: "700" }
});
