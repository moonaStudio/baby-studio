/**
 * 가장 쉬운 방법: 여기만 `true`로 바꾸면 로그인 없이 변환 테스트 가능.
 * 커밋·배포 전에는 반드시 `false`로 되돌리기.
 */
export const MANUAL_SKIP_AUTH_FOR_DEV = true;

/**
 * 프리미엄 테마·한도 체크를 전부 통과해 테스트할 때만 `true`.
 * 배포 전에는 반드시 `false`.
 */
export const MANUAL_PREMIUM_FOR_DEV = true;

export const CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL ?? "",
  REVENUECAT_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? "",
  FREE_THEME_LIMIT: 2,
  FREE_MONTHLY_LIMIT: 5,
  /** Face-slot + remove.bg + Replicate or OpenAI can exceed 1–3 minutes. */
  PROCESS_TIMEOUT_MS: 300000,
  /**
   * 로그인 스킵: 위 `MANUAL_SKIP_AUTH_FOR_DEV` 또는 환경 변수
   * `EXPO_PUBLIC_SKIP_AUTH=1` / `true`
   * 스토리지·API에는 고정 가짜 user id가 쓰입니다. 배포 빌드에서는 끄세요.
   */
  SKIP_AUTH_FOR_DEV:
    MANUAL_SKIP_AUTH_FOR_DEV ||
    process.env.EXPO_PUBLIC_SKIP_AUTH === "1" ||
    process.env.EXPO_PUBLIC_SKIP_AUTH === "true",
  /** Used when SKIP_AUTH_FOR_DEV and store에 userId 없음 */
  DEV_SKIP_USER_ID: "dev-skip-auth-user",
  /**
   * 프리미엄 전부 테스트: `MANUAL_PREMIUM_FOR_DEV` 또는 `EXPO_PUBLIC_PREMIUM_TEST=1`
   */
  PREMIUM_ALL_FOR_DEV:
    MANUAL_PREMIUM_FOR_DEV ||
    process.env.EXPO_PUBLIC_PREMIUM_TEST === "1" ||
    process.env.EXPO_PUBLIC_PREMIUM_TEST === "true"
};

export function isAuthGateSatisfied(userId?: string): boolean {
  return Boolean(userId) || CONFIG.SKIP_AUTH_FOR_DEV;
}

/** 스토어의 구독 상태와 무관하게, 플래그 켜지면 항상 프리미엄으로 취급 */
export function effectiveIsPremium(storeIsPremium: boolean): boolean {
  return storeIsPremium || CONFIG.PREMIUM_ALL_FOR_DEV;
}
