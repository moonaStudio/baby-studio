import { createClient } from "@supabase/supabase-js";
import Constants, { AppOwnership, ExecutionEnvironment } from "expo-constants";
import { makeRedirectUri } from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "../constants/config";

const APP_SCHEME = "babystudio";

/** Must match a row in Supabase → Auth → URL Configuration → Redirect URLs (exact or wildcard). */
const NATIVE_CUSTOM_SCHEME_REDIRECT = `${APP_SCHEME}://auth/callback`;

/** Web has no AsyncStorage native module; Supabase auth + local keys use localStorage on web. */
function createPersistStorage() {
  if (Platform.OS !== "web") {
    return AsyncStorage;
  }
  if (typeof window === "undefined") {
    const mem = new Map<string, string>();
    return {
      getItem: (key: string) => Promise.resolve(mem.get(key) ?? null),
      setItem: (key: string, value: string) => {
        mem.set(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        mem.delete(key);
        return Promise.resolve();
      }
    };
  }
  return {
    getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
    setItem: (key: string, value: string) => {
      window.localStorage.setItem(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      window.localStorage.removeItem(key);
      return Promise.resolve();
    }
  };
}

const persistStorage = createPersistStorage();

/**
 * Supabase only redirects here if this string matches the allow list; otherwise it sends the user
 * to Site URL (your Vercel root — "Baby Studio Backend").
 *
 * For native apps, prefer HTTPS on your deployed backend so GoTrue always accepts the same URL as
 * Site URL / allow list (avoids exp:// glob edge cases). The in-app browser receives ?code= here.
 */
function isExpoGo(): boolean {
  return (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === AppOwnership.Expo
  );
}

function getHttpsOAuthBridgeUrl(): string | null {
  const base = CONFIG.BACKEND_URL?.replace(/\/$/, "").trim();
  if (!base.startsWith("https://")) return null;
  return `${base}${CONFIG.OAUTH_BRIDGE_PATH}`;
}

function getOAuthRedirectTo(): string {
  if (Platform.OS === "web") {
    return makeRedirectUri({ path: "auth/callback" });
  }
  const bridge = getHttpsOAuthBridgeUrl();
  if (bridge) {
    return bridge;
  }
  if (isExpoGo()) {
    return Linking.createURL("auth/callback");
  }
  return NATIVE_CUSTOM_SCHEME_REDIRECT;
}

function extractPkceCodeFromCallbackUrl(url: string): string | undefined {
  const query = url.match(/[?&]code=([^&]+)/);
  if (query?.[1]) {
    return decodeURIComponent(query[1]);
  }
  const hash = url.includes("#") ? url.slice(url.indexOf("#") + 1) : "";
  const inHash = hash.match(/(?:^|[&])code=([^&]+)/);
  if (inHash?.[1]) {
    return decodeURIComponent(inHash[1]);
  }
  return undefined;
}

WebBrowser.maybeCompleteAuthSession();

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: {
    storage: persistStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce"
  }
});

export type OAuthProvider = "google";
type LocalAccount = { id: string; email: string; password: string };
const LOCAL_USERS_KEY = "local_auth_users_v1";
const LOCAL_SESSION_KEY = "local_auth_session_v1";

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithOAuth(provider: OAuthProvider) {
  const redirectTo = getOAuthRedirectTo();
  if (__DEV__) {
    console.warn(
      "[OAuth] redirectTo → add this exact URL to Supabase → Auth → Redirect URLs:",
      redirectTo
    );
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      // GoTrue는 이 플래그로 브라우저 302 체인 대신 OAuth URL만 안정적으로 쓰는 경우가 많음 (@supabase/auth-js가 누락할 때 대비)
      queryParams: { skip_http_redirect: "true" }
    }
  });
  if (error) throw error;
  if (!data?.url) throw new Error("로그인 URL을 가져오지 못했어요.");

  try {
    const authUrl = new URL(data.url);
    const sent = authUrl.searchParams.get("redirect_to");
    if (sent) {
      const decoded = decodeURIComponent(sent);
      if (decoded !== redirectTo) {
        throw new Error(`OAuth redirect_to 불일치. 앱: ${redirectTo} / 요청 URL: ${decoded}`);
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("OAuth redirect_to")) throw e;
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success" || !result.url) return;

  const code = extractPkceCodeFromCallbackUrl(result.url);
  const backendRoot = CONFIG.BACKEND_URL?.replace(/\/$/, "");
  if (
    !code &&
    backendRoot &&
    (result.url.startsWith("http://") || result.url.startsWith("https://")) &&
    result.url.startsWith(backendRoot) &&
    !result.url.includes(CONFIG.OAUTH_BRIDGE_PATH)
  ) {
    throw new Error(
      "구글 로그인 뒤 OAuth 브리지가 아니라 다른 페이지로만 열렸어요. " +
        "Supabase → Authentication → Redirect URLs에 이 주소를 추가했는지 확인해 주세요: " +
        `${getHttpsOAuthBridgeUrl() ?? redirectTo}`
    );
  }
  if (!code) throw new Error("로그인 코드를 확인할 수 없어요.");
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
  const raw = await persistStorage.getItem(LOCAL_USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LocalAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function setLocalUsers(users: LocalAccount[]) {
  await persistStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

async function getLocalSession() {
  const raw = await persistStorage.getItem(LOCAL_SESSION_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as { userId: string; email: string };
  } catch {
    return undefined;
  }
}

async function setLocalSession(session?: { userId: string; email: string }) {
  if (!session) {
    await persistStorage.removeItem(LOCAL_SESSION_KEY);
    return;
  }
  await persistStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
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
