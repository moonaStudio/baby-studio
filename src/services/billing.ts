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

export async function createCheckoutSession(packId: string, accessToken: string): Promise<string> {
  const res = await fetch(checkoutUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ packId })
  });
  const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !j.url) {
    throw new Error(j.error ?? `결제 준비 실패 (${res.status})`);
  }
  return j.url;
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
