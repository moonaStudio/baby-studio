import "react-native-get-random-values";
import "./src/polyfills/pkceWebCrypto";
import React from "react";
import { useFonts } from "expo-font";
import { Text, TextInput, View } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { appTheme } from "./src/constants/appTheme";

/** Same typography for all users — ignore OS accessibility font scale for layout consistency. */
const RNText = Text as typeof Text & { defaultProps?: { allowFontScaling?: boolean } };
RNText.defaultProps = { ...RNText.defaultProps, allowFontScaling: false };
const RNTextInput = TextInput as typeof TextInput & { defaultProps?: { allowFontScaling?: boolean } };
RNTextInput.defaultProps = { ...RNTextInput.defaultProps, allowFontScaling: false };

export default function App() {
  const [fontsLoaded] = useFonts({
    OngleipDaisy: require("./assets/fonts/OngleipDaisy.ttf")
  });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: "#FFF9FD" }} />;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <PaperProvider theme={appTheme}>
          <AppNavigator />
        </PaperProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
