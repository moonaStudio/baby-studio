import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useRef, useState } from "react";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useCamera } from "../../hooks/useCamera";
import { ImagePreview } from "../../components/ImagePreview";
import { isAuthGateSatisfied } from "../../constants/config";
import { useAppStore } from "../../store";

export function CameraScreen({ navigation }: any) {
  const { imageUri, takePhoto, clearLocalImage } = useCamera();
  const selectedTheme = useAppStore((s) => s.selectedTheme);
  const userId = useAppStore((s) => s.userId);
  const setSelectedImage = useAppStore((s) => s.setSelectedImage);
  const setResultImage = useAppStore((s) => s.setResultImage);
  const openedRef = useRef(false);
  const [showChoices, setShowChoices] = useState(false);

  const openCamera = useCallback(async () => {
    const gotPhoto = await takePhoto();
    if (gotPhoto) {
      setShowChoices(false);
    } else {
      setShowChoices(true);
    }
    return gotPhoto;
  }, [takePhoto]);

  useFocusEffect(
    useCallback(() => {
      if (!openedRef.current && !imageUri) {
        openedRef.current = true;
        void openCamera();
      }
      return () => {
        openedRef.current = false;
      };
    }, [imageUri, openCamera])
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
          <Button mode="outlined" onPress={openCamera}>
            다시 촬영하기
          </Button>
          <Button
            mode="outlined"
            onPress={() => {
              clearLocalImage();
              setShowChoices(true);
            }}
          >
            보관함에서 고르기
          </Button>
          <Button mode="text" onPress={() => navigation.navigate("Create")}>
            사진 선택 방법 바꾸기
          </Button>
        </>
      ) : showChoices ? (
        <>
          <Text variant="titleMedium">사진을 골라 주세요</Text>
          <Text style={{ color: "#6A2A56" }}>
            촬영을 취소하셨어요. 다시 카메라로 찍거나, 보관함에 있는 사진을 선택할 수 있어요.
          </Text>
          <Button mode="contained" onPress={() => void openCamera()}>
            카메라 다시 열기
          </Button>
          <Button mode="contained-tonal" onPress={() => navigation.navigate("UploadPick")}>
            보관함에서 고르기
          </Button>
          <Button mode="outlined" onPress={() => navigation.navigate("Create")}>
            사진 선택 화면으로 돌아가기
          </Button>
        </>
      ) : (
        <>
          <Text style={{ color: "#6A2A56" }}>카메라를 여는 중이에요…</Text>
          <Text variant="bodySmall" style={{ color: "#8A5A7B" }}>
            아기가 중앙에 오고 조명이 밝게 보이도록 촬영해 주세요.
          </Text>
        </>
      )}
    </View>
  );
}
