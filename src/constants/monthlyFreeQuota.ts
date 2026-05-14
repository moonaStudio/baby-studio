import { CONFIG } from "./config";

export function isMonthlyFreeQuotaExhausted(isPremium: boolean, monthlyFreeUsed: number): boolean {
  return !isPremium && monthlyFreeUsed >= CONFIG.FREE_MONTHLY_LIMIT;
}

export const MONTHLY_FREE_EXHAUSTED_TITLE = "이번 달 무료 이용이 끝났어요";

export function monthlyFreeExhaustedMessage(limit: number): string {
  return `이번 달 무료 사진 ${limit}장을 모두 썼어요. 프리미엄이나 크레딧 구매로 계속 이용해 주세요.`;
}
