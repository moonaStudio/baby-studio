import { createClient } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "../constants/config";

WebBrowser.maybeCompleteAuthSession();

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

export type OAuthProvider = "google" | "apple";
type LocalAccount = { id: string; email: string; password: string };
const LOCAL_USERS_KEY = "local_auth_users_v1";
const LOCAL_SESSION_KEY = "local_auth_session_v1";

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithOAuth(provider: OAuthProvider) {
  const redirectTo = Linking.createURL("auth/callback");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true
    }
  });
  if (error) throw error;
  if (!data?.url) throw new Error("로그인 URL을 가져오지 못했어요.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success" || !result.url) return;

  const codeMatch = result.url.match(/[?&]code=([^&]+)/);
  if (!codeMatch?.[1]) throw new Error("로그인 코드를 확인할 수 없어요.");

  const code = decodeURIComponent(codeMatch[1]);
  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
  if (sessionError) throw sessionError;
  return sessionData;
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function getLocalUsers(): Promise<LocalAccount[]> {
  const raw = await AsyncStorage.getItem(LOCAL_USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LocalAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function setLocalUsers(users: LocalAccount[]) {
  await AsyncStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

async function getLocalSession() {
  const raw = await AsyncStorage.getItem(LOCAL_SESSION_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as { userId: string; email: string };
  } catch {
    return undefined;
  }
}

async function setLocalSession(session?: { userId: string; email: string }) {
  if (!session) {
    await AsyncStorage.removeItem(LOCAL_SESSION_KEY);
    return;
  }
  await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
}

export async function signUpLocal(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) throw new Error("이메일과 비밀번호를 입력해 주세요.");
  const users = await getLocalUsers();
  if (users.some((u) => u.email === normalized)) {
    throw new Error("이미 가입된 이메일이에요.");
  }
  const account: LocalAccount = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: normalized,
    password
  };
  await setLocalUsers([...users, account]);
  await setLocalSession({ userId: account.id, email: account.email });
  return { user: { id: account.id, email: account.email } };
}

export async function signInLocal(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const users = await getLocalUsers();
  const user = users.find((u) => u.email === normalized && u.password === password);
  if (!user) throw new Error("이메일 또는 비밀번호가 맞지 않아요.");
  await setLocalSession({ userId: user.id, email: user.email });
  return { user: { id: user.id, email: user.email } };
}

export async function signOutUser() {
  await setLocalSession(undefined);
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUserId(): Promise<string | undefined> {
  const localSession = await getLocalSession();
  if (localSession?.userId) return localSession.userId;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.user?.id;
}

export async function getCurrentUserEmail(): Promise<string | undefined> {
  const localSession = await getLocalSession();
  if (localSession?.email) return localSession.email;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.email;
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export type GeneratedPhoto = {
  id: string;
  result_url: string;
  created_at: string;
};

export async function fetchGeneratedPhotos(userId: string): Promise<GeneratedPhoto[]> {
  const { data, error } = await supabase
    .from("generated_photos")
    .select("id,result_url,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as GeneratedPhoto[];
}

export async function deleteGeneratedPhoto(userId: string, photoId: string): Promise<void> {
  const { error } = await supabase
    .from("generated_photos")
    .delete()
    .eq("user_id", userId)
    .eq("id", photoId);
  if (error) throw error;
}
