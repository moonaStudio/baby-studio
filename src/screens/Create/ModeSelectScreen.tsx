import React from "react";
import { View } from "react-native";
import { Button, Card, RadioButton, Text } from "react-native-paper";
import { ImagePreview } from "../../components/ImagePreview";
import { useAppStore } from "../../store";
import { CreateMode } from "../../types";

export function ModeSelectScreen({ navigation }: any) {
  const selectedImageUri = useAppStore((s) => s.selectedImageUri);
  const selectedTheme = useAppStore((s) => s.selectedTheme);
  const createMode = useAppStore((s) => s.createMode);
  const setCreateMode = useAppStore((s) => s.setCreateMode);
  const setSelectedImage = useAppStore((s) => s.setSelectedImage);
  const setResultImage = useAppStore((s) => s.setResultImage);
  const hasChosenTheme = Boolean(selectedTheme);
  const hasChosenImage = Boolean(selectedImageUri);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <ImagePreview uri={selectedImageUri} />
      <Text variant="headlineSmall">오늘은 어떤 스타일로 만들까요?</Text>

      <Card onPress={() => setCreateMode("face")}>
        <Card.Content style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <RadioButton value="face" status={createMode === "face" ? "checked" : "unchecked"} />
            <Text variant="titleMedium">👶 얼굴 합성</Text>
          </View>
          <Text>프로필이나 일상 사진에 잘 어울려요.</Text>
        </Card.Content>
      </Card>

      <Card onPress={() => setCreateMode("full")}>
        <Card.Content style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <RadioButton value="full" status={createMode === "full" ? "checked" : "unchecked"} />
            <Text variant="titleMedium">👶 전신 합성</Text>
          </View>
          <Text>기념사진, 의상 사진에 잘 어울려요.</Text>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        disabled={!createMode}
        onPress={() => {
          if (hasChosenTheme && !hasChosenImage) {
            navigation.navigate("Create");
            return;
          }
          navigation.navigate("ThemeSelect");
        }}
      >
        계속하기
      </Button>
      {hasChosenImage ? (
        <Button
          mode="outlined"
          onPress={() => {
            setSelectedImage(undefined);
            setResultImage(undefined);
            navigation.navigate("Create");
          }}
        >
          사진 고르러 가기
        </Button>
      ) : null}
    </View>
  );
}
