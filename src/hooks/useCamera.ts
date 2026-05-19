import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

export function useCamera() {
  const [imageUri, setImageUri] = useState<string>();

  /** @returns true if user picked a photo */
  const takePhoto = async (): Promise<boolean> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return false;
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
      return true;
    }
    return false;
  };

  const clearLocalImage = () => setImageUri(undefined);

  return { imageUri, takePhoto, clearLocalImage };
}
