import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

export function useCamera() {
  const [imageUri, setImageUri] = useState<string>();

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  return { imageUri, takePhoto };
}
