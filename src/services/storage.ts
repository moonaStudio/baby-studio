import * as ImageManipulator from "expo-image-manipulator";
import { CONFIG } from "../constants/config";
import { supabase } from "./supabase";

/**
 * Supabase Storage 업로드는 JWT가 있어야 하고, RLS는 보통 `auth.uid()`와 경로 prefix를 맞춥니다.
 * 스킵 플래그·로컬 전용 id일 때는 익명 로그인으로 세션을 맞춥니다.
 */
async function resolveStorageAuthUserId(preferredFromStore?: string): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user?.id) {
    return sessionData.session.user.id;
  }

  const tryAnon =
    CONFIG.SKIP_AUTH_FOR_DEV ||
    preferredFromStore === CONFIG.DEV_SKIP_USER_ID ||
    (preferredFromStore?.startsWith("local-") ?? false);

  if (tryAnon) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      throw new Error(
        `사진 업로드용 익명 로그인에 실패했어요: ${error.message}. Supabase에서 Anonymous sign-in을 켜 주세요.`
      );
    }
    const uid = data.user?.id;
    if (!uid) throw new Error("사진 업로드용 사용자 ID를 가져오지 못했어요.");
    return uid;
  }

  throw new Error("로그인이 필요해요. 로그인한 뒤 다시 시도해 주세요.");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

async function readImageBytes(localUri: string): Promise<ArrayBuffer> {
  let uri = localUri;
  try {
    const normalized = await ImageManipulator.manipulateAsync(
      localUri,
      [],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
    uri = normalized.uri;
  } catch {
    // ph:// / content:// 등에서 manipulate가 실패하면 원본 URI로 fetch 재시도
  }

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`사진을 읽을 수 없어요. (${response.status}) 다른 사진을 선택해 주세요.`);
  }
  const fileBuffer = await response.arrayBuffer();
  if (!fileBuffer || fileBuffer.byteLength === 0) {
    throw new Error("선택한 사진이 비어 있어요. 다른 사진을 골라 주세요.");
  }
  return fileBuffer;
}

/** Storage 없이 백엔드 `/api/process`에 넘기기 위한 JPEG data URL. */
export async function localImageToJpegDataUrl(localUri: string): Promise<string> {
  const fileBuffer = await readImageBytes(localUri);
  return `data:image/jpeg;base64,${arrayBufferToBase64(fileBuffer)}`;
}

export async function uploadUserImage(
  userIdFromStore: string,
  localUri: string,
  bucket = "originals"
): Promise<string> {
  const storageUserId = await resolveStorageAuthUserId(userIdFromStore);
  const path = `${storageUserId}/${Date.now()}.jpg`;
  const fileBuffer = await readImageBytes(localUri);
  const { error } = await supabase.storage.from(bucket).upload(path, fileBuffer, {
    contentType: "image/jpeg",
    upsert: true
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
