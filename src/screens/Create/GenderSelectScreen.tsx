import React from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useAppStore } from "../../store";

export function GenderSelectScreen({ navigation, route }: any) {
  const setSelectedGender = useAppStore((s) => s.setSelectedGender);
  const selectedGender = useAppStore((s) => s.selectedGender);
  const nextScreen = route?.params?.nextScreen as string | undefined;

  const goNext = () => {
    if (nextScreen) {
      navigation.navigate(nextScreen);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("ThemeSelect");
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text variant="headlineSmall">성별 선택</Text>
      <Text>처음에 한 번만 선택하면 성별에 맞는 테마를 보여드려요.</Text>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button
          compact
          style={{ flex: 1 }}
          mode={selectedGender === "girl" ? "contained" : "outlined"}
          onPress={() => {
            setSelectedGender("girl");
            goNext();
          }}
        >
          여아
        </Button>
        <Button
          compact
          style={{ flex: 1 }}
          mode={selectedGender === "boy" ? "contained" : "outlined"}
          onPress={() => {
            setSelectedGender("boy");
            goNext();
          }}
        >
          남아
        </Button>
        <Button
          compact
          style={{ flex: 1 }}
          mode={!selectedGender ? "contained" : "outlined"}
          onPress={() => {
            setSelectedGender(undefined);
            goNext();
          }}
        >
          전체
        </Button>
      </View>
    </View>
  );
}
