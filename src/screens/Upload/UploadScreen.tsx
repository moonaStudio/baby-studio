import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useRef, useState } from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useImagePicker } from "../../hooks/useImagePicker";
import { isAuthGateSatisfied } from "../../constants/config";
import { useAppStore } from "../../store";
import { ImagePreview } from "../../components/ImagePreview";

export function UploadScreen({ navigation }: any) {
  const { imageUri, pickImage, clearLocalImage } = useImagePicker();
  const selectedTheme = useAppStore((s) => s.selectedTheme);
  const userId = useAppStore((s) => s.userId);
  const setSelectedImage = useAppStore((s) => s.setSelectedImage);
  const openedRef = useRef(false);
  const [showChoices, setShowChoices] = useState(false);

  const openLibrary = useCallback(async () => {
    const gotPhoto = await pickImage();
    if (gotPhoto) {
      setShowChoices(false);
    } else {
      setShowChoices(true);
    }
    return gotPhoto;
  }, [pickImage]);

  useFocusEffect(
    useCallback(() => {
      if (!openedRef.current && !imageUri) {
        openedRef.current = true;
        void openLibrary();
      }
      return () => {
        openedRef.current = false;
      };
    }, [imageUri, openLibrary])
  );

  const continueWithImage = () => {
    if (!imageUri) return;
    setSelectedImage(imageUri);
    if (!isAuthGateSatisfied(userId)) {
      navigation.navigate("Login");
      return;
    }
    if (selectedTheme) {
      navigation.navigate("Processing");
      return;
    }
    navigation.navigate("ThemeSelect");
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      {imageUri ? (
        <>
          <Text variant="titleMedium">선택한 사진</Text>
          <ImagePreview uri={imageUri} />
          <Button mode="contained" onPress={continueWithImage}>
            계속하기
          </Button>
          <Button mode="outlined" onPress={() => void openLibrary()}>
            다른 사진 고르기
          </Button>
          <Button
            mode="outlined"
            onPress={() => {
              clearLocalImage();
              navigation.navigate("CameraCapture");
            }}
          >
            카메라로 촬영하기
          </Button>
          <Button mode="text" onPress={() => navigation.navigate("Create")}>
            사진 선택 방법 바꾸기
          </Button>
        </>
      ) : showChoices ? (
        <>
          <Text variant="titleMedium">사진을 골라 주세요</Text>
          <Text style={{ color: "#6A2A56" }}>
            보관함 선택을 취소하셨어요. 다시 고르거나, 지금 촬영할 수 있어요.
          </Text>
          <Button mode="contained" onPress={() => void openLibrary()}>
            보관함 다시 열기
          </Button>
          <Button mode="contained-tonal" onPress={() => navigation.navigate("CameraCapture")}>
            카메라로 촬영하기
          </Button>
          <Button mode="outlined" onPress={() => navigation.navigate("Create")}>
            사진 선택 화면으로 돌아가기
          </Button>
        </>
      ) : (
        <>
          <Text style={{ color: "#6A2A56" }}>보관함을 여는 중이에요…</Text>
          <Text variant="bodySmall" style={{ color: "#8A5A7B" }}>
            배경이 단순하고 얼굴이 잘 보이는 사진이 좋아요.
          </Text>
        </>
      )}
    </View>
  );
}
