import { configureFonts, MD3LightTheme } from "react-native-paper";

const APP_FONT = "OngleipDaisy";

export const appTheme = {
  ...MD3LightTheme,
  roundness: 16,
  fonts: configureFonts({
    config: {
      displayLarge: { fontFamily: APP_FONT, fontWeight: "400" },
      displayMedium: { fontFamily: APP_FONT, fontWeight: "400" },
      displaySmall: { fontFamily: APP_FONT, fontWeight: "400" },
      headlineLarge: { fontFamily: APP_FONT, fontWeight: "400" },
      headlineMedium: { fontFamily: APP_FONT, fontWeight: "400" },
      headlineSmall: { fontFamily: APP_FONT, fontWeight: "400" },
      titleLarge: { fontFamily: APP_FONT, fontWeight: "400" },
      titleMedium: { fontFamily: APP_FONT, fontWeight: "400" },
      titleSmall: { fontFamily: APP_FONT, fontWeight: "400" },
      labelLarge: { fontFamily: APP_FONT, fontWeight: "400" },
      labelMedium: { fontFamily: APP_FONT, fontWeight: "400" },
      labelSmall: { fontFamily: APP_FONT, fontWeight: "400" },
      bodyLarge: { fontFamily: APP_FONT, fontWeight: "400" },
      bodyMedium: { fontFamily: APP_FONT, fontWeight: "400" },
      bodySmall: { fontFamily: APP_FONT, fontWeight: "400" }
    }
  }),
  colors: {
    ...MD3LightTheme.colors,
    primary: "#C86FB2",
    onPrimary: "#FFFFFF",
    primaryContainer: "#FFE3F4",
    onPrimaryContainer: "#4C113F",
    secondary: "#8C79D9",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#ECE6FF",
    onSecondaryContainer: "#2E255A",
    tertiary: "#68B8A6",
    onTertiary: "#FFFFFF",
    tertiaryContainer: "#D7F5EC",
    onTertiaryContainer: "#123C34",
    surface: "#FFF9FD",
    surfaceVariant: "#F7EFF7",
    outline: "#E8DCE8",
    background: "#FFF9FD"
  }
};
