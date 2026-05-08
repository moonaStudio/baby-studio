import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { signInLocal, signInWithEmail, signInWithOAuth } from "../../services/supabase";
import { useAppStore } from "../../store";

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const setUserId = useAppStore((s) => s.setUserId);
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 12 }}>
      <Text variant="headlineSmall">베이비 스튜디오</Text>
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
            setUserId(result.user?.id);
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
            const result = await signInLocal(email.trim(), password);
            setUserId(result.user?.id);
          } catch (e: any) {
            setError(e?.message ?? "간편 로그인에 실패했어요.");
          } finally {
            setLoading(false);
          }
        }}
      >
        API 없이 간편 로그인
      </Button>
      <Button
        mode="outlined"
        disabled={loading}
        onPress={async () => {
          setLoading(true);
          setError(undefined);
          try {
            const result = await signInWithOAuth("google");
            setUserId(result?.session?.user?.id);
          } catch (e: any) {
            setError(e?.message ?? "Google 로그인에 실패했어요.");
          } finally {
            setLoading(false);
          }
        }}
      >
        Google로 로그인
      </Button>
      <Button
        mode="outlined"
        disabled={loading}
        onPress={async () => {
          setLoading(true);
          setError(undefined);
          try {
            const result = await signInWithOAuth("apple");
            setUserId(result?.session?.user?.id);
          } catch (e: any) {
            setError(e?.message ?? "Apple 로그인에 실패했어요.");
          } finally {
            setLoading(false);
          }
        }}
      >
        Apple로 로그인
      </Button>
      <Button onPress={() => navigation.navigate("Signup")}>회원가입</Button>
      {error ? <Text>{error}</Text> : null}
    </View>
  );
}
