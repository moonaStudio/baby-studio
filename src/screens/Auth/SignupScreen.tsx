import React, { useState } from "react";
import { View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { signUpWithEmail } from "../../services/supabase";
import { useAppStore } from "../../store";

export function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const setUserId = useAppStore((s) => s.setUserId);

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, gap: 12 }}>
      <Text variant="headlineSmall">Moona Studio 계정 만들기</Text>
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
            const result = await signUpWithEmail(email.trim(), password);
            setUserId(result.user?.id);
            navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
          } catch (e: any) {
            setError(e?.message ?? "회원가입에 실패했어요.");
          } finally {
            setLoading(false);
          }
        }}
      >
        회원가입
      </Button>
      {error ? <Text>{error}</Text> : null}
    </View>
  );
}
