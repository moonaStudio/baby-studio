import { CONFIG } from "../constants/config";
import { supabase } from "./supabase";

function creditsUrl(): string {
  const base = CONFIG.BACKEND_URL.replace(/\/$/, "");
  return `${base}/api/billing/credits`;
}

function checkoutUrl(): string {
  const base = CONFIG.BACKEND_URL.replace(/\/$/, "");
  return `${base}/api/billing/create-checkout-session`;
}

function monthlyFreeUrl(): string {
  const base = CONFIG.BACKEND_URL.replace(/\/$/, "");
  return `${base}/api/billing/monthly-free`;
}

export async function fetchPhotoCredits(accessToken: string): Promise<number> {
  const res = await fetch(creditsUrl(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? `크레딧 조회 실패 (${res.status})`);
  }
  const j = (await res.json()) as { credits?: number };
  return typeof j.credits === "number" ? j.credits : 0;
}

export async function createCheckoutSession(
  packId: string,
  accessToken: string,
  appReturnUrl: string
): Promise<string> {
  const res = await fetch(checkoutUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ packId, appReturn: appReturnUrl })
  });
  const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !j.url) {
    throw new Error(j.error ?? `결제 준비 실패 (${res.status})`);
  }
  return j.url;
}

export async function fetchMonthlyFreeUsage(accessToken: string): Promise<{ used: number; month: string }> {
  const res = await fetch(monthlyFreeUrl(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const j = (await res.json().catch(() => ({}))) as { used?: number; month?: string; error?: string };
  if (!res.ok || typeof j.used !== "number" || !j.month) {
    throw new Error(j.error ?? `월 무료 사용량 조회 실패 (${res.status})`);
  }
  return { used: j.used, month: j.month };
}

export async function incrementMonthlyFreeUsage(accessToken: string): Promise<{ used: number; month: string }> {
  const res = await fetch(`${monthlyFreeUrl()}/increment`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const j = (await res.json().catch(() => ({}))) as { used?: number; month?: string; error?: string };
  if (!res.ok || typeof j.used !== "number" || !j.month) {
    throw new Error(j.error ?? `월 무료 사용 반영 실패 (${res.status})`);
  }
  return { used: j.used, month: j.month };
}

export async function refreshMonthlyFreeForSession(): Promise<{ used: number; month: string } | null> {
  if (!CONFIG.BACKEND_URL.trim() || CONFIG.SKIP_AUTH_FOR_DEV) {
    return null;
  }
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return null;
  }
  return fetchMonthlyFreeUsage(session.access_token);
}

/** Supabase 세션이 있을 때만 서버에서 크레딧을 가져옵니다. (SKIP_AUTH 로컬 모드에서는 null) */
export async function refreshPhotoCreditsForSession(): Promise<number | null> {
  if (!CONFIG.BACKEND_URL.trim()) {
    return null;
  }
  if (CONFIG.SKIP_AUTH_FOR_DEV) {
    return null;
  }
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return null;
  }
  return fetchPhotoCredits(session.access_token);
}
