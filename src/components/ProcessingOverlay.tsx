import React from "react";
import { View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

/** Max step index while waiting for API — avoids showing 100% for a long time. */
export const PROCESSING_OVERLAY_MAX_STEP = 2;

const STEPS = ["원본 확인 중", "테마에 맞게 합성 중", "이미지 마무리 중"];

export function ProcessingOverlay({ step }: { step: number }) {
  const current = Math.min(step, STEPS.length - 1);
  return (
    <View style={{ alignItems: "center", gap: 10, width: "90%" }}>
      <ActivityIndicator animating size="large" />
      <Text variant="titleMedium">사진을 만들고 있어요…</Text>
      <Text variant="bodySmall" style={{ opacity: 0.75 }}>
        완성까지 조금 시간이 걸릴 수 있어요.
      </Text>
      {STEPS.map((label, idx) => {
        const done = idx < current;
        const active = idx === current;
        return (
          <Text key={label} style={{ alignSelf: "flex-start", opacity: done || active ? 1 : 0.55 }}>
            {done ? "✓" : active ? "…" : "○"} {label}
          </Text>
        );
      })}
    </View>
  );
}
