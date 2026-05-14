import React from "react";
import { FlatList, View } from "react-native";
import { Template } from "../types";
import { ThemeCard } from "./ThemeCard";

type Props = {
  themes: Template[];
  isPremium: boolean;
  /** When true, non-premium themes in this grid show as locked (monthly free quota). */
  freeQuotaExhausted?: boolean;
  onSelect: (theme: Template) => void;
};

export function ThemeGrid({ themes, isPremium, freeQuotaExhausted = false, onSelect }: Props) {
  return (
    <FlatList
      data={themes}
      keyExtractor={(item) => item.slug}
      renderItem={({ item }) => {
        const premiumLocked = item.isPremium && !isPremium;
        const monthlyLocked = !item.isPremium && freeQuotaExhausted;
        const locked = premiumLocked || monthlyLocked;
        const lockReason = monthlyLocked ? "monthly_free" : "premium";
        return (
          <ThemeCard
            template={item}
            locked={locked}
            lockReason={locked ? lockReason : "premium"}
            onSelect={() => onSelect(item)}
          />
        );
      }}
      contentContainerStyle={{ padding: 16 }}
      ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
    />
  );
}
