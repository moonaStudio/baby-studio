import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { UI, cardBase, screenPadding } from "../../constants/ui";
import { signInWithEmail, signInWithOAuth } from "../../services/supabase";
import { useAppStore } from "../../store";

function goToMainTabs(navigation: { reset: (s: { index: number; routes: { name: string }[] }) => void }) {
  navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
}

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const setUserId = useAppStore((s) => s.setUserId);

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <MaterialCommunityIcons name="flower-tulip" size={36} color={UI.primaryDark} />
        <Text variant="headlineSmall" style={styles.title}>
          Moona Studio
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          우리 아기의 소중한 순간을{"\n"}스튜디오 감성으로 남겨 보세요.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput label="이메일" value={email} onChangeText={setEmail} mode="outlined" />
        <TextInput
          label="비밀번호"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          mode="outlined"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          mode="contained"
          loading={loading}
          disabled={loading}
          style={styles.btn}
          contentStyle={styles.btnContent}
          onPress={async () => {
            setLoading(true);
            setError(undefined);
            try {
              const result = await signInWithEmail(email.trim(), password);
              const uid = result.user?.id;
              if (!uid) {
                setError("로그인 정보를 확인할 수 없어요.");
                return;
              }
              setUserId(uid);
              goToMainTabs(navigation);
            } catch (e: any) {
              setError(e?.message ?? "로그인에 실패했어요.");
            } finally {
              setLoading(false);
            }
          }}
        >
          이메일 로그인
        </Button>
        <Button
          mode="outlined"
          loading={loading}
          disabled={loading}
          style={styles.btn}
          icon="google"
          onPress={async () => {
            setLoading(true);
            setError(undefined);
            try {
              const result = await signInWithOAuth("google");
              const uid = result.user?.id ?? result.session?.user?.id;
              if (uid) {
                setUserId(uid);
                goToMainTabs(navigation);
              } else {
                setError("로그인은 됐지만 사용자 정보를 가져오지 못했어요. 다시 시도해 주세요.");
              }
            } catch (e: any) {
              setError(e?.message ?? "Google 로그인에 실패했어요.");
            } finally {
              setLoading(false);
            }
          }}
        >
          Google로 계속하기
        </Button>
        <Button mode="text" onPress={() => navigation.navigate("Signup")}>
          계정 만들기
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: UI.bg,
    padding: screenPadding,
    justifyContent: "center",
    gap: 24
  },
  hero: {
    ...cardBase,
    backgroundColor: UI.primarySoft,
    borderColor: UI.borderStrong,
    padding: 24,
    alignItems: "center",
    gap: 8
  },
  title: { color: UI.ink, fontWeight: "800" },
  subtitle: { color: UI.inkMuted, textAlign: "center", lineHeight: 22 },
  form: { gap: 12 },
  error: { color: "#C62828" },
  btn: { borderRadius: 14 },
  btnContent: { paddingVertical: 4 }
});
