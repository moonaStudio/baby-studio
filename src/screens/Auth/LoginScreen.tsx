import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
    <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 12 }}>
      <Text variant="headlineSmall">Moona Studio</Text>
      <TextInput label="Email" value={email} onChangeText={setEmail} />
      <TextInput
        label="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />
      <Button
        mode="contained"
        loading={loading}
        disabled={loading}
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
        disabled={loading}
        onPress={async () => {
          setLoading(true);
          setError(undefined);
          try {
            const result = await signInWithOAuth("google");
            const uid = result?.session?.user?.id;
            if (!uid) {
              setError("로그인을 완료하지 않았어요.");
              return;
            }
            setUserId(uid);
            goToMainTabs(navigation);
          } catch (e: any) {
            setError(e?.message ?? "Google 로그인에 실패했어요.");
          } finally {
            setLoading(false);
          }
        }}
        icon={({ size }) => <MaterialCommunityIcons name="google" size={size + 4} color="#4285F4" />}
      >
        Google로 계속하기
      </Button>
      <Button onPress={() => navigation.navigate("Signup")}>회원가입</Button>
      {error ? <Text>{error}</Text> : null}
    </View>
  );
}
