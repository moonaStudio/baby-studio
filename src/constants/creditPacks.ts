/** App Store / Play / RevenueCat 상품 ID와 동일하게 맞추세요. */
export const CREDIT_PACK_IDS = ["pack_1", "pack_5", "pack_10"] as const;

export type CreditPackId = (typeof CREDIT_PACK_IDS)[number];

export const CREDIT_PACK_CREDITS: Record<CreditPackId, number> = {
  pack_1: 1,
  pack_5: 5,
  pack_10: 10
};

export const CREDIT_PACK_FALLBACK_LABELS: Record<CreditPackId, string> = {
  pack_1: "1장",
  pack_5: "5장",
  pack_10: "10장"
};

export function isCreditPackId(id: string): id is CreditPackId {
  return (CREDIT_PACK_IDS as readonly string[]).includes(id);
}
