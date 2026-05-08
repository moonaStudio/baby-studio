import React from "react";
import { FlatList, View } from "react-native";
import { Template } from "../types";
import { ThemeCard } from "./ThemeCard";

type Props = {
  themes: Template[];
  isPremium: boolean;
  onSelect: (theme: Template) => void;
};

export function ThemeGrid({ themes, isPremium, onSelect }: Props) {
  return (
    <FlatList
      data={themes}
      keyExtractor={(item) => item.slug}
      renderItem={({ item }) => (
        <ThemeCard
          template={item}
          locked={item.isPremium && !isPremium}
          onSelect={() => onSelect(item)}
        />
      )}
      contentContainerStyle={{ padding: 16 }}
      ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
    />
  );
}
