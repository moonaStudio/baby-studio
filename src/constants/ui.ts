import { Platform, ViewStyle } from "react-native";

export const UI = {
  bg: "#FFF9FD",
  bgSoft: "#FFF2FA",
  surface: "#FFFFFF",
  ink: "#4C113F",
  inkMuted: "#8A5A7B",
  inkSoft: "#6A2A56",
  primary: "#C86FB2",
  primaryDark: "#A24A8C",
  primarySoft: "#FFEAF7",
  secondary: "#8C79D9",
  secondarySoft: "#F4EEFF",
  border: "#EFDCEE",
  borderStrong: "#E8CFE3",
  success: "#68B8A6",
  shadow: "#C86FB2"
} as const;

export const screenPadding = 20;

export const cardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: UI.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16
  },
  android: { elevation: 3 },
  default: {}
}) as ViewStyle;

export const cardBase: ViewStyle = {
  backgroundColor: UI.surface,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: UI.border,
  overflow: "hidden",
  ...cardShadow
};
