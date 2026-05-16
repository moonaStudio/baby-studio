import { Platform } from "react-native";
import {
  cacheDirectory,
  copyAsync,
  documentDirectory,
  downloadAsync,
  getInfoAsync,
  makeDirectoryAsync
} from "expo-file-system/legacy";
import { ensureLocalFileFromImageUri } from "./resultImageFile";

const GALLERY_SUBDIR = "moona-app-gallery/";

export function isPersistedAppGalleryPath(uri: string): boolean {
  return uri.includes(GALLERY_SUBDIR.slice(0, -1));
}

/**
 * Copies the image into the app document folder so it survives restarts and appears in the Gallery tab.
 * Caller should run `saveImageUriToDeviceLibrary` first when saving to the system Photos app.
 */
export async function copyImageToPermanentAppGallery(imageUri: string): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error("앱 갤러리 파일 저장은 웹에서 지원하지 않아요.");
  }
  const base = documentDirectory;
  if (!base) {
    throw new Error("저장 공간을 사용할 수 없어요.");
  }

  let source = imageUri;
  if (imageUri.startsWith("http://") || imageUri.startsWith("https://")) {
    const tmpBase = cacheDirectory ?? base;
    const tmp = `${tmpBase}moona-dl-${Date.now()}.jpg`;
    const { uri, status } = await downloadAsync(imageUri, tmp);
    if (status !== 200) {
      throw new Error("이미지를 받아오지 못했어요.");
    }
    source = uri;
  } else {
    source = await ensureLocalFileFromImageUri(imageUri);
  }

  const dir = `${base}${GALLERY_SUBDIR}`;
  const dirInfo = await getInfoAsync(dir);
  if (!dirInfo.exists) {
    await makeDirectoryAsync(dir, { intermediates: true });
  }
  const lower = source.toLowerCase();
  const ext = lower.includes(".png") ? "png" : "jpg";
  const dest = `${dir}save-${Date.now()}.${ext}`;
  await copyAsync({ from: source, to: dest });
  return dest;
}
