import { useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

export function useImagePicker() {
  const [imageUri, setImageUri] = useState<string>();

  /** @returns true if user picked a photo */
  const pickImage = async (): Promise<boolean> => {
    const existing = await ImagePicker.getMediaLibraryPermissionsAsync();
    let { granted } = existing;
    if (!granted) {
      const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
      granted = requested.granted;
    }
    if (!granted) {
      Alert.alert(
        "Photo library access",
        "Allow Photos access for Moona Studio in Settings to pick from your gallery.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.92,
      allowsMultipleSelection: false,
      ...(Platform.OS === "ios"
        ? {
            preferredAssetRepresentationMode:
              ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible
          }
        : {})
    });

    if (result.canceled || !result.assets?.[0]?.uri) return false;
    setImageUri(result.assets[0].uri);
    return true;
  };

  const clearLocalImage = () => setImageUri(undefined);

  return { imageUri, pickImage, clearLocalImage };
}
