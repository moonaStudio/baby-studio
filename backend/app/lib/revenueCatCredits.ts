import { CREDIT_PACKS, isCreditPackId, type CreditPackId } from "./creditPacks";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** RevenueCat / 스토어 product_id → 크레딧 수 */
export function creditsForStoreProductId(productId: string): number | null {
  if (isCreditPackId(productId)) {
    return CREDIT_PACKS[productId].credits;
  }
  for (const packId of Object.keys(CREDIT_PACKS) as CreditPackId[]) {
    if (productId === packId || productId.endsWith(`.${packId}`) || productId.includes(packId)) {
      return CREDIT_PACKS[packId].credits;
    }
  }
  return null;
}

export function isSupabaseUserId(appUserId: string): boolean {
  return UUID_RE.test(appUserId);
}

/** 웹훅 멱등 키 (Stripe checkout_session_id 컬럼 재사용) */
export function revenueCatGrantId(eventId: string): string {
  return `rc_${eventId}`;
}

/** NON_RENEWING_PURCHASE 등 크레딧 지급 대상 이벤트 */
export function isRevenueCatCreditEvent(eventType: string): boolean {
  return eventType === "NON_RENEWING_PURCHASE";
}
