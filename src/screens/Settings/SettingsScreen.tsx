import React from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Button, Card, Divider, Snackbar, Text, TextInput } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getCurrentUserAuthProviders,
  getCurrentUserEmail,
  sendPasswordReset,
  signInWithOAuth,
  signOutUser
} from "../../services/supabase";
import { CONFIG } from "../../constants/config";
import { redeemPromoCode } from "../../services/billing";
import { supabase } from "../../services/supabase";
import { useAppStore } from "../../store";

const BG = "#FFF9FD";
const INK = "#4C113F";
const INK_MUTED = "#6A2A56";
const BORDER = "#F0E4EF";
const CARD_TINT = "#FFEAF7";
const ACCENT = "#A24A8C";

const CARD = { borderRadius: 16, backgroundColor: CARD_TINT } as const;
const BTN = { borderRadius: 12 } as const;

export function SettingsScreen({ navigation }: any) {
  const userId = useAppStore((s) => s.userId);
  const photoCredits = useAppStore((s) => s.photoCredits);
  const isPremium = useAppStore((s) => s.isPremium);
  const setUserId = useAppStore((s) => s.setUserId);
  const setPhotoCredits = useAppStore((s) => s.setPhotoCredits);
  const [promoCode, setPromoCode] = React.useState("");
  const [promoBusy, setPromoBusy] = React.useState(false);
  const [email, setEmail] = React.useState<string>();
  const [authProviders, setAuthProviders] = React.useState<string[]>([]);
  const [emailLoading, setEmailLoading] = React.useState(false);
  const [snack, setSnack] = React.useState<{ visible: boolean; message: string }>({
    visible: false,
    message: ""
  });
  const [busy, setBusy] = React.useState<"google" | "signout" | "reset" | null>(null);

  const isLocalOrDevUser =
    !!userId && (userId.startsWith("local-") || userId === CONFIG.DEV_SKIP_USER_ID);
  const isLoggedIn = Boolean(userId);
  const hasEmailPasswordLogin = authProviders.includes("email");
  const hasGoogleLogin = authProviders.includes("google");

  const showSnack = (message: string) => setSnack({ visible: true, message });

  const applyPromoCode = React.useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;
      if (CONFIG.SKIP_AUTH_FOR_DEV || isLocalOrDevUser) {
        showSnack("로그인 후에만 이벤트 코드를 쓸 수 있어요.");
        return;
      }
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showSnack("로그인이 필요해요.");
        return;
      }
      setPromoBusy(true);
      try {
        const result = await redeemPromoCode(session.access_token, code);
        setPhotoCredits(result.credits);
        setPromoCode("");
        showSnack(`이벤트 코드 적용! +${result.creditsAdded}장 (보유 ${result.credits}장)`);
      } catch (e) {
        showSnack(e instanceof Error ? e.message : "코드를 적용하지 못했어요.");
      } finally {
        setPromoBusy(false);
      }
    },
    [isLocalOrDevUser, setPhotoCredits]
  );

  React.useEffect(() => {
    const pending = useAppStore.getState().pendingPromoCode;
    if (pending && isLoggedIn && !isLocalOrDevUser) {
      useAppStore.getState().setPendingPromoCode(undefined);
      void applyPromoCode(pending);
    }
  }, [isLoggedIn, isLocalOrDevUser, applyPromoCode]);

  React.useEffect(() => {
    if (!isLoggedIn) {
      setEmail(undefined);
      setAuthProviders([]);
      setEmailLoading(false);
      return;
    }
    setEmailLoading(true);
    Promise.all([getCurrentUserEmail(), getCurrentUserAuthProviders()])
      .then(([em, providers]) => {
        setEmail(em);
        setAuthProviders(providers);
      })
      .catch(() => {
        setEmail(undefined);
        setAuthProviders([]);
      })
      .finally(() => setEmailLoading(false));
  }, [isLoggedIn, userId]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 28,
          gap: 14
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: BORDER }}>
          <Text variant="headlineSmall" style={{ color: INK, fontWeight: "800", fontFamily: "System" }}>
            내 정보
          </Text>
          <Text variant="bodyMedium" style={{ color: INK_MUTED, marginTop: 4 }}>
            계정과 보안 설정을 관리해요.
          </Text>
        </View>

        <Card style={CARD} mode="elevated" elevation={0}>
          <Card.Content style={{ gap: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: "#FCE4F0",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "#F5C9E4"
                }}
              >
                <MaterialCommunityIcons name="account-heart-outline" size={38} color={ACCENT} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                {isLoggedIn ? (
                  <>
                    <Text variant="labelMedium" style={{ color: ACCENT }}>
                      로그인됨
                    </Text>
                    {emailLoading ? (
                      <ActivityIndicator color={ACCENT} />
                    ) : (
                      <Text variant="titleMedium" style={{ color: INK }} numberOfLines={2}>
                        {email ?? "이메일을 불러오는 중이에요."}
                      </Text>
                    )}
                    {isLocalOrDevUser ? (
                      <Text variant="bodySmall" style={{ color: INK_MUTED }}>
                        로컬·개발 계정이에요.
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Text variant="labelMedium" style={{ color: ACCENT }}>
                      게스트
                    </Text>
                    <Text variant="titleMedium" style={{ color: INK }}>
                      로그인하면 기기 간에 동기화돼요.
                    </Text>
                  </>
                )}
              </View>
            </View>

            {isLoggedIn && !isLocalOrDevUser ? (
              <>
                <Divider style={{ backgroundColor: BORDER }} />
                <Pressable
                  onPress={() => navigation.navigate("Subscription")}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 4,
                    opacity: pressed ? 0.75 : 1
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <MaterialCommunityIcons name="wallet-outline" size={22} color={ACCENT} />
                    <View>
                      <Text variant="titleSmall" style={{ color: INK }}>
                        크레딧 · 구독
                      </Text>
                      <Text variant="bodySmall" style={{ color: INK_MUTED }}>
                        보유 {photoCredits}장{isPremium ? " · 프리미엄" : ""}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={ACCENT} />
                </Pressable>
              </>
            ) : null}
          </Card.Content>
        </Card>

        {isLoggedIn && !isLocalOrDevUser ? (
          <Card style={CARD} mode="elevated" elevation={0}>
            <Card.Content style={{ gap: 10 }}>
              <Text variant="titleMedium" style={{ color: INK }}>
                이벤트 코드
              </Text>
              <Text variant="bodySmall" style={{ color: INK_MUTED, lineHeight: 20 }}>
                인스타 이벤트 코드가 있으면 입력하세요. 스토리 @moonas는 DM 후 수동 지급돼요.
              </Text>
              <TextInput
                mode="outlined"
                label="코드"
                value={promoCode}
                autoCapitalize="characters"
                onChangeText={setPromoCode}
                style={{ backgroundColor: "#FFF" }}
              />
              <Button
                mode="contained"
                style={BTN}
                loading={promoBusy}
                disabled={promoBusy || !promoCode.trim()}
                onPress={() => void applyPromoCode(promoCode)}
              >
                코드 적용
              </Button>
            </Card.Content>
          </Card>
        ) : null}

        <Card style={CARD} mode="elevated" elevation={0}>
          <Card.Content style={{ gap: 10 }}>
            <Text variant="titleMedium" style={{ color: INK }}>
              계정
            </Text>
            {isLoggedIn ? (
              <View style={{ gap: 10 }}>
                {isLocalOrDevUser ? (
                  <Text variant="bodySmall" style={{ color: INK_MUTED, lineHeight: 20 }}>
                    이 기기 전용 로컬·개발 모드예요. 클라우드 계정 비밀번호 설정은 여기서 하지 않아요.
                  </Text>
                ) : null}
                {!isLocalOrDevUser && hasGoogleLogin && !hasEmailPasswordLogin ? (
                  <Text variant="bodySmall" style={{ color: INK_MUTED, lineHeight: 20 }}>
                    Google로만 연결된 계정이에요. Moona에는 Google 비밀번호가 저장되지 않고, 앱에서도
                    알 수 없어요. 로그인은 Google 화면에서 하면 되고, 비밀번호 변경은 Google 계정
                    설정에서 하면 돼요.
                  </Text>
                ) : null}
                {!isLocalOrDevUser && hasGoogleLogin && hasEmailPasswordLogin ? (
                  <Text variant="bodySmall" style={{ color: INK_MUTED, lineHeight: 20 }}>
                    Google 로그인과 이메일 로그인을 둘 다 쓸 수 있어요. Moona「비밀번호」는 이메일
                    로그인용이며 Google 비밀번호와는 별개예요.
                  </Text>
                ) : null}
                {!isLocalOrDevUser && hasEmailPasswordLogin ? (
                  <>
                    <Text variant="bodySmall" style={{ color: INK_MUTED, lineHeight: 20 }}>
                      비밀번호를 바꾸거나 잊었을 때는 메일 링크로 안전하게 재설정할 수 있어요.
                    </Text>
                    <Button
                      mode="outlined"
                      style={BTN}
                      disabled={!email || busy !== null}
                      loading={busy === "reset"}
                      onPress={async () => {
                        if (!email) return;
                        setBusy("reset");
                        try {
                          await sendPasswordReset(email);
                          showSnack("비밀번호 재설정 메일을 보냈어요. 메일함을 확인해 주세요.");
                        } catch (e: any) {
                          showSnack(e?.message ?? "메일을 보내지 못했어요.");
                        } finally {
                          setBusy(null);
                        }
                      }}
                    >
                      비밀번호 재설정 메일 보내기
                    </Button>
                  </>
                ) : null}
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Button
                    mode="outlined"
                    style={{ flex: 1, ...BTN }}
                    disabled={busy !== null}
                    onPress={() => navigation.navigate("Login")}
                  >
                    이메일 로그인
                  </Button>
                  <Button
                    mode="contained"
                    style={{ flex: 1, ...BTN }}
                    disabled={busy !== null}
                    onPress={() => navigation.navigate("Signup")}
                  >
                    회원가입
                  </Button>
                </View>
                <Button
                  mode="outlined"
                  style={BTN}
                  disabled={busy !== null}
                  loading={busy === "google"}
                  icon={({ size }) => (
                    <MaterialCommunityIcons name="google" size={size + 4} color="#4285F4" />
                  )}
                  onPress={async () => {
                    setBusy("google");
                    try {
                      const result = await signInWithOAuth("google");
                      setUserId(result?.session?.user?.id);
                      showSnack("Google 로그인에 성공했어요.");
                    } catch (e: any) {
                      showSnack(e?.message ?? "Google 로그인에 실패했어요.");
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  Google로 계속하기
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {isLoggedIn ? (
          <Button
            mode="outlined"
            style={{ ...BTN, borderColor: "#E8B4C4" }}
            textColor="#9B3B5C"
            disabled={busy !== null}
            loading={busy === "signout"}
            onPress={async () => {
              setBusy("signout");
              try {
                await signOutUser();
                setUserId(undefined);
                showSnack("로그아웃했어요.");
              } catch (e: any) {
                showSnack(e?.message ?? "로그아웃에 실패했어요.");
              } finally {
                setBusy(null);
              }
            }}
          >
            로그아웃
          </Button>
        ) : null}
      </ScrollView>

      <Snackbar
        visible={snack.visible}
        onDismiss={() => setSnack((s) => ({ ...s, visible: false }))}
        duration={4200}
        style={{ marginBottom: 8 }}
      >
        {snack.message}
      </Snackbar>
    </View>
  );
}
