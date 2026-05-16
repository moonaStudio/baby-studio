import { Platform } from "react-native";
import { copyImageToPermanentAppGallery } from "./appGalleryStorage";

/** After saving to the system photo library, copy into app storage and append to the Gallery tab list (native only). */
export async function appendToPersistedAppGallery(
  addLocalSavedPhoto: (url: string) => void,
  imageUri: string
): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }
  const path = await copyImageToPermanentAppGallery(imageUri);
  addLocalSavedPhoto(path);
}
