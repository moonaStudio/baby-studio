import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Image, ScrollView, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";
import { useAppStore } from "../../store";

export function CreateSourceScreen({ navigation }: any) {
  const selectedTheme = useAppStore((s) => s.selectedTheme);

  useFocusEffect(
    useCallback(() => {
      if (!selectedTheme) {
        navigation.navigate("Theme");
      }
    }, [navigation, selectedTheme])
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, backgroundColor: "#FFF9FD" }}>
      <Card style={{ backgroundColor: "#FFEAF7" }}>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="labelMedium" style={{ color: "#8A3C75" }}>
            선택된 테마
          </Text>
          <Text variant="titleLarge" style={{ color: "#4C113F", fontWeight: "800" }}>
            {selectedTheme?.name ?? "테마를 불러오는 중"}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Chip compact icon="palette-outline">
              테마 확정 완료
            </Chip>
            <Chip compact icon="image-outline">
              이제 사진만 선택
            </Chip>
          </View>
          {selectedTheme?.previewImage ? (
            <Image
              source={selectedTheme.previewImage}
              style={{ width: "100%", height: 140, borderRadius: 12 }}
              resizeMode="cover"
            />
          ) : null}
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={{ color: "#4C113F", fontWeight: "700" }}>
        사진 선택 방식
      </Text>

      <Card
        style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDA3CC" }}
        onPress={() => navigation.navigate("CameraCapture")}
      >
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">📸 지금 촬영하기</Text>
          <Text style={{ color: "#8A5A7B" }}>밝은 곳에서 아기 얼굴이 중앙에 오게 찍으면 가장 잘 나와요.</Text>
          <Button mode="contained" onPress={() => navigation.navigate("CameraCapture")}>
            지금 촬영 시작하기
          </Button>
        </Card.Content>
      </Card>

      <Card
        style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D7C6FA" }}
        onPress={() => navigation.navigate("UploadPick")}
      >
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">🖼️ 보관함에서 고르기</Text>
          <Text style={{ color: "#8A5A7B" }}>이미 있는 사진 중 표정이 잘 나온 컷으로 편하게 시작할 수 있어요.</Text>
          <Button mode="contained-tonal" onPress={() => navigation.navigate("UploadPick")}>
            보관함 열기
          </Button>
        </Card.Content>
      </Card>

      <Card style={{ backgroundColor: "#FFF2FA", borderWidth: 1, borderColor: "#F1D7E8" }}>
        <Card.Content style={{ gap: 4 }}>
          <Text variant="labelLarge" style={{ color: "#8A3C75" }}>
            사진 팁
          </Text>
          <Text style={{ color: "#8A5A7B" }}>- 얼굴이 또렷하고 정면에 가까운 사진</Text>
          <Text style={{ color: "#8A5A7B" }}>- 강한 역광/어두운 사진은 피하기</Text>
          <Text style={{ color: "#8A5A7B" }}>- 모자, 손, 스티커로 얼굴이 가려지지 않게</Text>
        </Card.Content>
      </Card>

      <Button mode="outlined" onPress={() => navigation.navigate("Theme")}>
        테마 다시 고르기
      </Button>
    </ScrollView>
  );
}
