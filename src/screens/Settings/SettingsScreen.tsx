import React from "react";
import { View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import {
  getCurrentUserEmail,
  sendPasswordReset,
  signInWithOAuth,
  signOutUser,
  updatePassword
} from "../../services/supabase";
import { CONFIG } from "../../constants/config";
import { useAppStore } from "../../store";

const CARD_STYLE = { borderRadius: 10 } as const;
const BUTTON_STYLE = { borderRadius: 8 } as const;

export function SettingsScreen({ navigation }: any) {
  const userId = useAppStore((s) => s.userId);
  const setUserId = useAppStore((s) => s.setUserId);
  const [email, setEmail] = React.useState<string>();
  const [newPassword, setNewPassword] = React.useState("");
  const [message, setMessage] = React.useState<string>();
  const isLocalOrDevUser =
    !!userId && (userId.startsWith("local-") || userId === CONFIG.DEV_SKIP_USER_ID);
  const canManagePassword = Boolean(userId && email && !isLocalOrDevUser);
  const isLoggedIn = Boolean(userId);

  React.useEffect(() => {
    if (!isLoggedIn) {
      setEmail(undefined);
      return;
    }
    getCurrentUserEmail()
      .then((v) => setEmail(v))
      .catch(() => setEmail(undefined));
  }, [isLoggedIn, userId]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text variant="titleLarge">You</Text>

      <Card style={CARD_STYLE}>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">Account</Text>
          <Text>
            {email
              ? `Email: ${email}`
              : isLoggedIn
                ? "Logged in (email syncing...)"
                : "Guest mode (not logged in)"}
          </Text>
          {isLoggedIn ? (
            <Button
              mode="outlined"
              style={BUTTON_STYLE}
              onPress={async () => {
                try {
                  if (!email) return;
                  await sendPasswordReset(email);
                  setMessage("Password reset email sent.");
                } catch (e: any) {
                  setMessage(e?.message ?? "Failed to send reset email.");
                }
              }}
            >
              Send password reset email
            </Button>
          ) : (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button
                  mode="outlined"
                  style={{ flex: 1, ...BUTTON_STYLE }}
                  onPress={() => navigation.navigate("Login")}
                >
                  Login
                </Button>
                <Button
                  mode="contained"
                  style={{ flex: 1, ...BUTTON_STYLE }}
                  onPress={() => navigation.navigate("Signup")}
                >
                  Sign up
                </Button>
              </View>
              <Button
                mode="outlined"
                style={BUTTON_STYLE}
                onPress={async () => {
                  try {
                    const result = await signInWithOAuth("google");
                    setUserId(result?.session?.user?.id);
                  } catch (e: any) {
                    setMessage(e?.message ?? "Google 로그인 실패");
                  }
                }}
              >
                Google로 로그인
              </Button>
              <Button
                mode="outlined"
                style={BUTTON_STYLE}
                onPress={async () => {
                  try {
                    const result = await signInWithOAuth("apple");
                    setUserId(result?.session?.user?.id);
                  } catch (e: any) {
                    setMessage(e?.message ?? "Apple 로그인 실패");
                  }
                }}
              >
                Apple로 로그인
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {canManagePassword ? (
        <Card style={CARD_STYLE}>
          <Card.Content style={{ gap: 8 }}>
            <Text variant="titleMedium">Security</Text>
            <TextInput
              label="New password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <Button
              mode="outlined"
              style={BUTTON_STYLE}
              disabled={newPassword.length < 6}
              onPress={async () => {
                try {
                  await updatePassword(newPassword);
                  setNewPassword("");
                  setMessage("Password updated.");
                } catch (e: any) {
                  setMessage(e?.message ?? "Failed to update password.");
                }
              }}
            >
              Update password
            </Button>
          </Card.Content>
        </Card>
      ) : null}

      {message ? <Text>{message}</Text> : null}

      <Button
        mode="outlined"
        style={BUTTON_STYLE}
        disabled={!isLoggedIn}
        onPress={async () => {
          await signOutUser();
          setUserId(undefined);
          setMessage("Signed out.");
        }}
      >
        Sign out
      </Button>
    </View>
  );
}
