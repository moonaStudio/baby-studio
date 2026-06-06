import React from "react";
import { Alert, Platform, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { CONFIG } from "../../constants/config";
import { fetchMonthlyFreeUsage, fetchPhotoCredits } from "../../services/billing";
import {
  isStoreBillingAvailable,
  loadStoreCreditPacks,
  purchaseCreditPack,
  restoreStorePurchases,
  type StoreCreditPack
} from "../../services/purchases";
import { supabase } from "../../services/supabase";
import { useAppStore } from "../../store";

async function waitForCredits(
  accessToken: string,
  previous: number,
  attempts = 8,
  delayMs = 1500
): Promise<number> {
  let latest = previous;
  for (let i = 0; i < attempts; i += 1) {
    await new Promise((r) => setTimeout(r, delayMs));
    latest = await fetchPhotoCredits(accessToken);
    if (latest > previous) {
      return latest;
    }
  }
  return latest;
}

export function SubscriptionScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const photoCredits = useAppStore((s) => s.photoCredits);
  const setPhotoCredits = useAppStore((s) => s.setPhotoCredits);
  const setMonthlyFreeUsed = useAppStore((s) => s.setMonthlyFreeUsed);
  const [busyPack, setBusyPack] = React.useState<string | null>(null);
  const [packs, setPacks] = React.useState<StoreCreditPack[]>([]);
  const [loadingPacks, setLoadingPacks] = React.useState(true);
  const storeBilling = isStoreBillingAvailable();

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (CONFIG.SKIP_AUTH_FOR_DEV) return;
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session?.access_token || cancelled) return;
      try {
        const c = await fetchPhotoCredits(session.access_token);
        if (!cancelled) setPhotoCredits(c);
        const m = await fetchMonthlyFreeUsage(session.access_token);
        if (!cancelled) setMonthlyFreeUsed(m.used);
      } catch {
        // 무시
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setPhotoCredits, setMonthlyFreeUsed]);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingPacks(true);
    void loadStoreCreditPacks()
      .then((list) => {
        if (!cancelled) setPacks(list);
      })
      .finally(() => {
        if (!cancelled) setLoadingPacks(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onBuy = async (pack: StoreCreditPack) => {
    if (CONFIG.SKIP_AUTH_FOR_DEV) {
      Alert.alert(
        "알림",
        "로컬 개발 모드(SKIP_AUTH)에서는 스토어 결제를 할 수 없어요. 실제 로그인으로 테스트해 주세요."
      );
      return;
    }
    if (Platform.OS === "web") {
      Alert.alert("알림", "사진 패키지는 iOS·Android 앱에서 App Store / Google Play로 구매할 수 있어요.");
      return;
    }
    if (!storeBilling) {
      Alert.alert(
        "설정 필요",
        "RevenueCat API 키(EXPO_PUBLIC_REVENUECAT_API_KEY)가 없어요. .env를 확인한 뒤 개발 빌드로 다시 실행해 주세요."
      );
      return;
    }
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      Alert.alert("로그인 필요", "결제하려면 먼저 로그인해 주세요.");
      return;
    }
    setBusyPack(pack.id);
    const before = photoCredits;
    try {
      await purchaseCreditPack(pack);
      const after = await waitForCredits(session.access_token, before);
      setPhotoCredits(after);
      if (after > before) {
        Alert.alert("완료", `크레딧이 반영됐어요. (보유 ${after}장)`);
      } else {
        Alert.alert(
          "결제 완료",
          "결제는 완료됐지만 크레딧 반영이 조금 지연될 수 있어요. 잠시 후 다시 열어 보시거나, 문제가 계속되면 문의해 주세요."
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "결제를 완료할 수 없어요.";
      if (!msg.toLowerCase().includes("cancel") && !msg.includes("취소")) {
        Alert.alert("오류", msg);
      }
    } finally {
      setBusyPack(null);
    }
  };

  const onRestore = async () => {
    if (!storeBilling) {
      Alert.alert("설정 필요", "RevenueCat API 키가 설정되지 않았어요.");
      return;
    }
    try {
      await restoreStorePurchases();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        const c = await fetchPhotoCredits(session.access_token);
        setPhotoCredits(c);
      }
      Alert.alert("복원", "구매 복원을 요청했어요. 소모성 크레딧은 스토어 정책상 자동 복원되지 않을 수 있어요.");
    } catch (e) {
      Alert.alert("오류", e instanceof Error ? e.message : "복원에 실패했어요.");
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: "center" }}>
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="headlineSmall">프리미엄 사진 패키지</Text>
          <Text variant="bodyMedium">
            {Platform.OS === "web"
              ? "모바일 앱에서 App Store 또는 Google Play로 구매할 수 있어요."
              : "App Store / Google Play 인앱 결제입니다. 결제 후 크레딧이 자동으로 반영돼요."}
          </Text>
          <Text variant="titleMedium">보유 크레딧: {photoCredits}장</Text>
        </Card.Content>
      </Card>
      {loadingPacks ? (
        <Text variant="bodyMedium">상품 불러오는 중…</Text>
      ) : (
        packs.map((pack) => (
          <Button
            key={pack.id}
            mode="contained"
            loading={busyPack === pack.id}
            disabled={busyPack !== null || !storeBilling}
            onPress={() => void onBuy(pack)}
          >
            {`${pack.photos}장 ${pack.priceLabel}`}
          </Button>
        ))
      )}
      {storeBilling ? (
        <Button mode="outlined" onPress={() => void onRestore()}>
          구매 복원
        </Button>
      ) : null}
      <Button mode="text" onPress={() => navigation.goBack()}>
        닫기
      </Button>
    </View>
  );
}
