import { Platform } from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { cacheDirectory, writeAsStringAsync, EncodingType } from "expo-file-system/legacy";

/**
 * MediaLibrary / Sharing need a real file URI. Our pipeline stores results as data URLs.
 */
export async function ensureLocalFileFromImageUri(imageUri: string): Promise<string> {
  if (Platform.OS === "web") {
    throw new Error("Web: use triggerWebDownload instead");
  }
  if (!imageUri.startsWith("data:")) {
    if (imageUri.startsWith("file://") || imageUri.startsWith("content://")) {
      return imageUri;
    }
    return imageUri.startsWith("/") ? `file://${imageUri}` : imageUri;
  }

  const base = cacheDirectory;
  if (!base) {
    throw new Error("임시 저장 폴더를 사용할 수 없어요.");
  }

  const comma = imageUri.indexOf(",");
  if (comma <= 0) throw new Error("이미지 데이터 형식이 올바르지 않아요.");
  const header = imageUri.slice(0, comma).toLowerCase();
  const body = imageUri.slice(comma + 1).replace(/\s/g, "");
  const ext = header.includes("png") ? "png" : "jpg";
  const path = `${base}moona-studio-share-${Date.now()}.${ext}`;

  await writeAsStringAsync(path, body, { encoding: EncodingType.Base64 });
  return path;
}

export function triggerWebDownload(imageUri: string, filename = "moona-studio.jpg") {
  if (Platform.OS !== "web") return;
  const a = document.createElement("a");
  a.href = imageUri;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Request photo library permission if needed, then save (native) or download (web). */
export async function saveImageUriToDeviceLibrary(imageUri: string): Promise<void> {
  if (Platform.OS === "web") {
    triggerWebDownload(imageUri);
    return;
  }
  const current = await MediaLibrary.getPermissionsAsync();
  let granted = current.granted;
  if (!granted) {
    const requested = await MediaLibrary.requestPermissionsAsync();
    granted = requested.granted;
  }
  if (!granted) {
    throw new Error("사진함 저장을 위해 사진(미디어) 권한이 필요해요.");
  }
  const fileUri = await ensureLocalFileFromImageUri(imageUri);
  await MediaLibrary.saveToLibraryAsync(fileUri);
}

export async function shareImageUri(imageUri: string): Promise<void> {
  if (Platform.OS === "web") {
    triggerWebDownload(imageUri, `moona-studio-${Date.now()}.jpg`);
    return;
  }
  const fileUri = await ensureLocalFileFromImageUri(imageUri);
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("이 기기에서는 시스템 공유를 쓸 수 없어요.");
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: fileUri.endsWith(".png") ? "image/png" : "image/jpeg",
    dialogTitle: "Moona Studio"
  });
}
