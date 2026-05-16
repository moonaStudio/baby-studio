import React, { useState } from "react";
import { Alert, Platform, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useAppStore } from "../../store";
import { ImagePreview } from "../../components/ImagePreview";
import { saveImageUriToDeviceLibrary, shareImageUri, triggerWebDownload } from "../../utils/resultImageFile";
import { appendToPersistedAppGallery } from "../../utils/recordPersistedGallery";

export function ResultScreen({ navigation }: any) {
  const resultImageUri = useAppStore((s) => s.resultImageUri);
  const addLocalSavedPhoto = useAppStore((s) => s.addLocalSavedPhoto);
  const setSelectedImage = useAppStore((s) => s.setSelectedImage);
  const setResultImage = useAppStore((s) => s.setResultImage);
  const [busy, setBusy] = useState<"save" | "share" | null>(null);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text variant="titleLarge">완성된 스튜디오 사진</Text>
      <ImagePreview uri={resultImageUri} />
      <Button
        mode="contained"
        loading={busy === "save"}
        disabled={!resultImageUri || busy !== null}
        onPress={async () => {
          if (!resultImageUri) return;
          if (Platform.OS === "web") {
            triggerWebDownload(resultImageUri);
            Alert.alert("저장", "브라우저에서 파일 저장을 시작했어요.");
            return;
          }
          setBusy("save");
          try {
            await saveImageUriToDeviceLibrary(resultImageUri);
            try {
              await appendToPersistedAppGallery(addLocalSavedPhoto, resultImageUri);
            } catch {
              Alert.alert(
                "저장 안내",
                "사진 앱에는 저장됐어요. 앱 갤러리 목록에만 반영하지 못했어요. 저장 공간을 확인해 주세요."
              );
              return;
            }
            Alert.alert("저장 완료", "사진 앱과 Moona 갤러리 탭에 모두 저장했어요.");
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            Alert.alert("저장 실패", msg || "알 수 없는 오류가 났어요.");
          } finally {
            setBusy(null);
          }
        }}
      >
        사진 앱 + Moona 갤러리에 저장
      </Button>
      <Button
        mode="outlined"
        loading={busy === "share"}
        disabled={!resultImageUri || busy !== null}
        onPress={async () => {
          if (!resultImageUri) return;
          if (Platform.OS === "web") {
            triggerWebDownload(resultImageUri, `moona-studio-share-${Date.now()}.jpg`);
            return;
          }
          setBusy("share");
          try {
            await shareImageUri(resultImageUri);
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            Alert.alert("공유 실패", msg || "알 수 없는 오류가 났어요.");
          } finally {
            setBusy(null);
          }
        }}
      >
        공유하기
      </Button>
      <Button mode="outlined" onPress={() => navigation.navigate("ThemeSelect")}>
        다른 테마 선택
      </Button>
      <Button
        mode="outlined"
        onPress={() => {
          setSelectedImage(undefined);
          setResultImage(undefined);
          navigation.navigate("Create");
        }}
      >
        사진 고르러 가기
      </Button>
    </View>
  );
}
