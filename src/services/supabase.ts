import { createClient } from "@supabase/supabase-js";
import Constants, { AppOwnership, ExecutionEnvironment } from "expo-constants";
import { makeRedirectUri } from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "../constants/config";
import { withTimeout } from "../utils/withTimeout";

const APP_SCHEME = "babystudio";

/** Must match a row in Supabase → Auth → URL Configuration → Redirect URLs (exact or wildcard). */
const NATIVE_CUSTOM_SCHEME_REDIRECT = `${APP_SCHEME}://auth/callback`;

async function resetOauthInAppBrowserState(): Promise<void> {
  try {
    WebBrowser.dismissAuthSession();
  } catch {
    // not available on all platforms
  }
}

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
 * to Site URL (e.g. Vercel root).
 *
 * Do NOT use https://… as redirectTo with WebBrowser.openAuthSessionAsync on iOS: without
 * Associated Domains + preferUniversalLinks, ASWebAuthenticationSession uses scheme "https" and
 * often never completes — the sheet stays open forever.
 *
 * Expo Go: exp://… (add exp://** in Supabase). Dev / release: babystudio://auth/callback.
 */
function isExpoGo(): boolean {
  return (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === AppOwnership.Expo
  );
}

/** Deep link the app listens for after Vercel hands off the OAuth code. */
function getNativeOAuthReturnUrl(): string {
  if (isExpoGo()) {
    return Linking.createURL("auth/callback");
  }
  return NATIVE_CUSTOM_SCHEME_REDIRECT;
}

/** URL sent to Supabase — must be on Redirect URLs allow list. */
function getSupabaseOAuthRedirectTo(): string {
  if (Platform.OS === "web") {
    return makeRedirectUri({ path: "auth/callback" });
  }
  const backend = CONFIG.BACKEND_URL?.replace(/\/$/, "");
  const nativeReturn = getNativeOAuthReturnUrl();
  // Pass native return so Vercel can deep-link (HTTPS alone won't close iOS auth sheet).
  // Supabase allow list should include https://baby-studio-omega.vercel.app/** (query ok).
  if (backend) {
    return `${backend}/auth/callback?app_return=${encodeURIComponent(nativeReturn)}`;
  }
  return nativeReturn;
}

/** Prefix that tells the in-app browser when to close and return to the app. */
function getBrowserOAuthReturnPrefix(): string {
  if (Platform.OS === "web") {
    return getSupabaseOAuthRedirectTo();
  }
  // Match the deep link Vercel opens (exp://… or babystudio://…), not HTTPS.
  return getNativeOAuthReturnUrl();
}

/**
 * Parse PKCE `code` from the OAuth return URL. Prefer WHATWG URL (handles exp://…).
 * Strip trailing `#` / `%23` — iOS can append a spurious fragment to the code param
 * when custom-scheme redirects are malformed (see supabase/auth#2423).
 */
function extractPkceCodeFromCallbackUrl(url: string): string | undefined {
  const stripCodeNoise = (raw: string) =>
    raw
      .trim()
      .replace(/#+$/g, "")
      .replace(/%23$/gi, "")
      .trim();

  try {
    const u = new URL(url);
    const fromQuery = u.searchParams.get("code");
    if (fromQuery) {
      const c = stripCodeNoise(fromQuery);
      if (c) return c;
    }
    if (u.hash && u.hash.length > 1) {
      const hashParams = new URLSearchParams(u.hash.slice(1));
      const fromHash = hashParams.get("code");
      if (fromHash) {
        const c = stripCodeNoise(fromHash);
        if (c) return c;
      }
    }
  } catch {
    // non-URL or exotic scheme — fall back below
  }

  const query = url.match(/[?&]code=([^&]+)/);
  if (query?.[1]) {
    const c = stripCodeNoise(decodeURIComponent(query[1]));
    if (c) return c;
  }
  const hash = url.includes("#") ? url.slice(url.indexOf("#") + 1) : "";
  const inHash = hash.match(/(?:^|[&])code=([^&]+)/);
  if (inHash?.[1]) {
    const c = stripCodeNoise(decodeURIComponent(inHash[1]));
    if (c) return c;
  }
  return undefined;
}

const OAUTH_BROWSER_TIMEOUT_MS = 120_000;

/** openAuthSessionAsync + deep-link fallback (Android) + timeout so UI never spins forever. */
async function openOAuthBrowser(authUrl: string, returnPrefix: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const cleanup = (sub?: { remove: () => void }) => {
      sub?.remove();
      clearTimeout(timer);
    };
    const finish = (url: string, sub?: { remove: () => void }) => {
      if (settled) return;
      settled = true;
      cleanup(sub);
      resolve(url);
    };
    const fail = (err: Error, sub?: { remove: () => void }) => {
      if (settled) return;
      settled = true;
      cleanup(sub);
      reject(err);
    };

    const sub =
      Platform.OS === "web"
        ? undefined
        : Linking.addEventListener("url", ({ url }) => {
            if (!extractPkceCodeFromCallbackUrl(url)) return;
            finish(url, sub);
          });

    const timer = setTimeout(() => {
      fail(
        new Error(
          "로그인 시간이 초과됐어요. 구글 로그인 후 창이 안 닫히면 앱을 재시작하고 다시 시도해 주세요."
        ),
        sub
      );
    }, OAUTH_BROWSER_TIMEOUT_MS);

    void WebBrowser.openAuthSessionAsync(authUrl, returnPrefix).then((result) => {
      if (settled) return;
      if (result.type === "cancel" || result.type === "dismiss") {
        fail(
          new Error(
            "로그인 창을 먼저 닫으면 완료되지 않아요. 구글까지 끝나면 보통 1~2초 안에 창이 스스로 닫혀요."
          ),
          sub
        );
        return;
      }
      if (result.type !== "success" || !result.url) {
        fail(new Error("로그인이 중단되었어요. 다시 시도해 주세요."), sub);
        return;
      }
      finish(result.url, sub);
    });
  });
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

/** Second OAuth start overwrites PKCE verifier in storage and breaks exchange. */
let oauthSignInInFlight = false;

export async function signInWithOAuth(provider: OAuthProvider) {
  if (oauthSignInInFlight) {
    throw new Error(
      "로그인 요청이 이미 진행 중이에요. 브라우저 창을 닫거나 완료한 뒤 다시 눌러 주세요."
    );
  }
  oauthSignInInFlight = true;
  try {
    return await signInWithOAuthInner(provider);
  } finally {
    oauthSignInInFlight = false;
  }
}

async function signInWithOAuthInner(provider: OAuthProvider) {
  if (Platform.OS !== "web") {
    await resetOauthInAppBrowserState();
  }

  const redirectTo = getSupabaseOAuthRedirectTo();
  const browserReturnPrefix = getBrowserOAuthReturnPrefix();
  console.warn("[OAuth] Supabase redirectTo:", redirectTo);
  console.warn("[OAuth] Browser close prefix:", browserReturnPrefix);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true
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

  const resultUrl = await withTimeout(
    openOAuthBrowser(data.url, browserReturnPrefix),
    OAUTH_BROWSER_TIMEOUT_MS + 5_000,
    "oauth"
  );

  const url = resultUrl;
  const code = extractPkceCodeFromCallbackUrl(url);
  if (!code) {
    throw new Error(
      "로그인 코드를 확인할 수 없어요. Supabase Redirect URLs에 아래가 있는지 확인하세요.\n\n" +
        `${redirectTo}`
    );
  }
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

/** e.g. `["email"]`, `["google"]`, or both — for account UI. Prefer `app_metadata.providers` (linked auth methods); `identities` alone can list `email` for OAuth users without a real email-password login. */
export async function getCurrentUserAuthProviders(): Promise<string[]> {
  const localSession = await getLocalSession();
  if (localSession?.userId) return ["local"];
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const user = data.user;
  if (!user) return [];
  const meta = user.app_metadata?.providers;
  if (Array.isArray(meta) && meta.length > 0) {
    return [...new Set(meta as string[])];
  }
  const fromIdentities = user.identities?.map((i) => i.provider) ?? [];
  return [...new Set(fromIdentities)];
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
