import React from "react";
import { Alert, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { CONFIG } from "../../constants/config";
import { createCheckoutSession, fetchMonthlyFreeUsage, fetchPhotoCredits } from "../../services/billing";
import { supabase } from "../../services/supabase";
import { useAppStore } from "../../store";

type CreditPack = {
  id: "pack_1" | "pack_5" | "pack_10";
  photos: number;
  priceLabel: string;
};

const CREDIT_PACKS: CreditPack[] = [
  { id: "pack_1", photos: 1, priceLabel: "$0.99" },
  { id: "pack_5", photos: 5, priceLabel: "$4.99" },
  { id: "pack_10", photos: 10, priceLabel: "$8.99" }
];

export function SubscriptionScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const photoCredits = useAppStore((s) => s.photoCredits);
  const setPhotoCredits = useAppStore((s) => s.setPhotoCredits);
  const setMonthlyFreeUsed = useAppStore((s) => s.setMonthlyFreeUsed);
  const [busyPack, setBusyPack] = React.useState<string | null>(null);

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

  const onBuy = async (packId: CreditPack["id"]) => {
    if (CONFIG.SKIP_AUTH_FOR_DEV) {
      Alert.alert(
        "알림",
        "로컬 개발 모드(SKIP_AUTH)에서는 Stripe 결제를 할 수 없어요. 실제 로그인으로 테스트해 주세요."
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
    setBusyPack(packId);
    try {
      const appReturn = Linking.createURL("billing/success");
      const url = await createCheckoutSession(packId, session.access_token, appReturn);
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      Alert.alert("오류", e instanceof Error ? e.message : "결제를 시작할 수 없어요.");
    } finally {
      setBusyPack(null);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: "center" }}>
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="headlineSmall">프리미엄 사진 패키지</Text>
          <Text variant="bodyMedium">
            Stripe Checkout으로 결제합니다. 완료 후 앱으로 돌아오면 크레딧이 반영돼요.
          </Text>
          <Text variant="titleMedium">보유 크레딧: {photoCredits}장</Text>
        </Card.Content>
      </Card>
      {CREDIT_PACKS.map((pack) => (
        <Button
          key={pack.id}
          mode="contained"
          loading={busyPack === pack.id}
          disabled={busyPack !== null}
          onPress={() => void onBuy(pack.id)}
        >
          {`${pack.photos}장 ${pack.priceLabel}`}
        </Button>
      ))}
      <Button mode="text" onPress={() => navigation.goBack()}>
        닫기
      </Button>
    </View>
  );
}
