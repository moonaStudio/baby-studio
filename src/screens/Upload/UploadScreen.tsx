import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useRef } from "react";
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
  const setResultImage = useAppStore((s) => s.setResultImage);
  const openedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!openedRef.current && !imageUri) {
        openedRef.current = true;
        void pickImage();
      }
      return () => {
        openedRef.current = false;
      };
    }, [imageUri, pickImage])
  );

  const goPickPhotoAgain = () => {
    clearLocalImage();
    setSelectedImage(undefined);
    setResultImage(undefined);
    navigation.navigate("Create");
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text>아기 사진을 업로드해 주세요. 배경이 단순하고 얼굴이 잘 보이는 사진이 좋아요.</Text>
      {!imageUri ? (
        <Button mode="outlined" onPress={pickImage}>
          보관함 다시 열기
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
