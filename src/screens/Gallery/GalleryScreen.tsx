import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View
} from "react-native";
import { Button, Card, IconButton, Text } from "react-native-paper";
import { deleteGeneratedPhoto, fetchGeneratedPhotos, GeneratedPhoto } from "../../services/supabase";
import { useAppStore } from "../../store";
import { SavedPhoto } from "../../types";
import { saveImageUriToDeviceLibrary, shareImageUri, triggerWebDownload } from "../../utils/resultImageFile";

type GalleryItem = SavedPhoto | GeneratedPhoto;

function isLocalItem(item: GalleryItem): boolean {
  return item.id.startsWith("local-");
}

export function GalleryScreen() {
  const userId = useAppStore((s) => s.userId);
  const localSavedPhotos = useAppStore((s) => s.localSavedPhotos);
  const removeLocalSavedPhoto = useAppStore((s) => s.removeLocalSavedPhoto);
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<GeneratedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [actionBusy, setActionBusy] = useState<"save" | "share" | "delete" | null>(null);

  const reloadRemote = useCallback(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    fetchGeneratedPhotos(userId)
      .then((rows) => setItems(rows))
      .catch((e: { message?: string }) => setError(e?.message ?? "갤러리를 불러오지 못했어요."))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    reloadRemote();
  }, [reloadRemote]);

  const mergedItems: GalleryItem[] = [...localSavedPhotos, ...items];
  const pad = 16;
  const gap = 10;
  const tile = Math.max(140, (width - pad * 2 - gap) / 2);

  const closeDetail = () => {
    if (actionBusy) return;
    setSelected(null);
  };

  const confirmDelete = (item: GalleryItem) => {
    Alert.alert("이 사진을 삭제할까요?", "삭제하면 목록에서만 사라져요.", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          setActionBusy("delete");
          try {
            if (isLocalItem(item)) {
              removeLocalSavedPhoto(item.id);
            } else {
              if (!userId) throw new Error("로그인이 필요해요.");
              await deleteGeneratedPhoto(userId, item.id);
              setItems((prev) => prev.filter((p) => p.id !== item.id));
            }
            setSelected(null);
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            Alert.alert("삭제 실패", msg || "다시 시도해 주세요.");
          } finally {
            setActionBusy(null);
          }
        }
      }
    ]);
  };

  const onSave = async (uri: string) => {
    setActionBusy("save");
    try {
      await saveImageUriToDeviceLibrary(uri);
      Alert.alert("저장 완료", "사진 앱에 저장했어요.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert("저장 실패", msg || "다시 시도해 주세요.");
    } finally {
      setActionBusy(null);
    }
  };

  const onShare = async (uri: string) => {
    setActionBusy("share");
    try {
      await shareImageUri(uri);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert("공유 실패", msg || "갤러리에 저장한 뒤 사진 앱에서 공유해 보세요.");
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: pad, paddingTop: 16, paddingBottom: 8 }}>
        <Text variant="titleLarge">내가 만든 사진</Text>
        {loading ? (
          <Text style={{ marginTop: 8 }}>불러오는 중…</Text>
        ) : null}
        {error ? (
          <Text style={{ color: "#B00020", marginTop: 8 }}>{error}</Text>
        ) : null}
        {!loading && !error && mergedItems.length === 0 ? (
          <Card style={{ marginTop: 12 }}>
            <Card.Content>
              <Text>아직 생성된 사진이 없어요. 첫 번째 사진을 만들어보세요.</Text>
            </Card.Content>
          </Card>
        ) : null}
      </View>

      <FlatList
        data={mergedItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: pad, paddingBottom: 32, gap }}
        columnWrapperStyle={{ gap }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelected(item)}
            style={{ width: tile }}
            accessibilityRole="button"
            accessibilityLabel="사진 상세"
          >
            <Image
              source={{ uri: item.result_url }}
              style={{
                width: tile,
                height: tile,
                borderRadius: 12,
                backgroundColor: "#f0f0f0"
              }}
              resizeMode="cover"
            />
            <Text variant="bodySmall" style={{ marginTop: 6, color: "#666" }} numberOfLines={1}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </Pressable>
        )}
      />

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={closeDetail}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Pressable
            style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.55)" }]}
            onPress={closeDetail}
          />
          <View
            style={{
              width: Math.min(width - 32, 420),
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 16,
              maxHeight: "92%"
            }}
          >
            {selected ? (
              <>
                <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 4 }}>
                  <IconButton icon="close" onPress={closeDetail} accessibilityLabel="닫기" />
                </View>
                <Image
                  source={{ uri: selected.result_url }}
                  style={{
                    width: "100%",
                    height: Math.min(360, width - 64),
                    borderRadius: 12,
                    backgroundColor: "#eee"
                  }}
                  resizeMode="contain"
                />
                <Text variant="bodyMedium" style={{ marginTop: 12, marginBottom: 16 }}>
                  {new Date(selected.created_at).toLocaleString()}
                  {isLocalItem(selected) ? " · 이 기기에만 저장됨" : ""}
                </Text>
                <View style={{ gap: 10 }}>
                  <Button
                    mode="contained"
                    loading={actionBusy === "save"}
                    disabled={actionBusy !== null}
                    onPress={() => {
                      if (Platform.OS === "web" && selected) {
                        triggerWebDownload(selected.result_url);
                        return;
                      }
                      if (selected) void onSave(selected.result_url);
                    }}
                  >
                    사진함에 저장
                  </Button>
                  <Button
                    mode="outlined"
                    loading={actionBusy === "share"}
                    disabled={actionBusy !== null}
                    onPress={() => {
                      if (selected) void onShare(selected.result_url);
                    }}
                  >
                    공유하기
                  </Button>
                  <Button
                    mode="outlined"
                    textColor="#B00020"
                    loading={actionBusy === "delete"}
                    disabled={actionBusy !== null}
                    onPress={() => selected && confirmDelete(selected)}
                  >
                    삭제
                  </Button>
                  <Button mode="text" onPress={closeDetail} disabled={actionBusy !== null}>
                    닫기
                  </Button>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
