import React from "react";
import { Image } from "react-native";

export function ImagePreview({ uri }: { uri?: string }) {
  if (!uri) return null;
  return (
    <Image
      source={{ uri }}
      style={{ width: "100%", height: 360, borderRadius: 14, resizeMode: "cover" }}
    />
  );
}
