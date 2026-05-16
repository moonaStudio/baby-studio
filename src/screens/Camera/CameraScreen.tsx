import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useRef } from "react";
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

  useFocusEffect(
    useCallback(() => {
      if (!openedRef.current && !imageUri) {
        openedRef.current = true;
        void takePhoto();
      }
      return () => {
        openedRef.current = false;
      };
    }, [imageUri, takePhoto])
  );

  const goPickPhotoAgain = () => {
    clearLocalImage();
    setSelectedImage(undefined);
    setResultImage(undefined);
    navigation.navigate("Create");
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text>아기가 중앙에 오고 조명이 밝게 보이도록 촬영해 주세요.</Text>
      {!imageUri ? (
        <Button mode="outlined" onPress={takePhoto}>
          카메라 다시 열기
        </Button>
      ) : null}
      <ImagePreview uri={imageUri} />
      {imageUri && (
        <>
          <Button
            mode="contained"
            onPress={() => {
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
            }}
          >
            계속하기
          </Button>
          <Button mode="outlined" onPress={goPickPhotoAgain}>
            사진 고르러 가기
          </Button>
        </>
      )}
    </View>
  );
}
