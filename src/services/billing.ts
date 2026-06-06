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

function consumeCreditUrl(): string {
  const base = CONFIG.BACKEND_URL.replace(/\/$/, "");
  return `${base}/api/billing/consume-credit`;
}

function redeemPromoUrl(): string {
  const base = CONFIG.BACKEND_URL.replace(/\/$/, "");
  return `${base}/api/billing/redeem-promo`;
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

/** @deprecated 스토어 앱에서는 RevenueCat 사용. 웹/레거시 전용. */
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

/** Returns new balance, or `null` if insufficient credits (402). */
export async function consumePhotoCredit(accessToken: string): Promise<number | null> {
  const res = await fetch(consumeCreditUrl(), {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const j = (await res.json().catch(() => ({}))) as { credits?: number; error?: string };
  if (res.status === 402) {
    return null;
  }
  if (res.status === 404) {
    throw new Error(
      "크레딧 차감 API를 찾을 수 없어요 (404). 배포된 백엔드에 `/api/billing/consume-credit`가 포함됐는지, 앱의 EXPO_PUBLIC_BACKEND_URL이 그 서버를 가리키는지 확인해 주세요. (404는 Supabase 함수 없음이 아니라 보통 서버 경로 문제입니다.)"
    );
  }
  if (res.status === 401) {
    throw new Error(j.error ?? "인증이 필요해요. 다시 로그인한 뒤 시도해 주세요.");
  }
  if (!res.ok || typeof j.credits !== "number") {
    const server = j.error?.trim();
    if (res.status >= 500) {
      throw new Error(
        server
          ? `${server}\n\n(Supabase에 public.consume_one_photo_credit 마이그레이션이 적용됐는지, 서버 환경 변수를 확인해 주세요.)`
          : `크레딧 차감 실패 (${res.status}). Supabase RPC와 서버 로그를 확인해 주세요.`
      );
    }
    throw new Error(server || `크레딧 차감 실패 (${res.status})`);
  }
  return j.credits;
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

export async function redeemPromoCode(accessToken: string, code: string): Promise<{ creditsAdded: number; credits: number }> {
  const res = await fetch(redeemPromoUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ code: code.trim() })
  });
  const j = (await res.json().catch(() => ({}))) as {
    creditsAdded?: number;
    credits?: number;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(j.error ?? `코드 적용 실패 (${res.status})`);
  }
  return {
    creditsAdded: j.creditsAdded ?? 0,
    credits: j.credits ?? 0
  };
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
