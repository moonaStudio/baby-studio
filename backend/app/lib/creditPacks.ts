export const CREDIT_PACKS = {
  pack_1: { unitAmount: 99, credits: 1 },
  pack_5: { unitAmount: 499, credits: 5 },
  pack_10: { unitAmount: 899, credits: 10 }
} as const;

export type CreditPackId = keyof typeof CREDIT_PACKS;

export function isCreditPackId(id: string): id is CreditPackId {
  return id in CREDIT_PACKS;
}
