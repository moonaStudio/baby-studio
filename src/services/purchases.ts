import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type PurchasesOffering,
  type PurchasesPackage
} from "react-native-purchases";
import { CONFIG } from "../constants/config";
import {
  CREDIT_PACK_CREDITS,
  CREDIT_PACK_FALLBACK_LABELS,
  CREDIT_PACK_IDS,
  type CreditPackId,
  isCreditPackId
} from "../constants/creditPacks";

export type StoreCreditPack = {
  id: CreditPackId;
  photos: number;
  priceLabel: string;
  rcPackage: PurchasesPackage | null;
};

function revenueCatApiKey(): string | null {
  if (Platform.OS === "ios") {
    return (CONFIG.REVENUECAT_API_KEY_IOS || CONFIG.REVENUECAT_API_KEY).trim() || null;
  }
  if (Platform.OS === "android") {
    return (CONFIG.REVENUECAT_API_KEY_ANDROID || CONFIG.REVENUECAT_API_KEY).trim() || null;
  }
  return null;
}

export function isStoreBillingAvailable(): boolean {
  return Platform.OS !== "web" && revenueCatApiKey() !== null;
}

let configured = false;

export async function configurePurchasesForUser(userId: string): Promise<void> {
  if (!isStoreBillingAvailable()) {
    return;
  }
  const apiKey = revenueCatApiKey();
  if (!apiKey) {
    return;
  }
  if (!configured) {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    Purchases.configure({ apiKey });
    configured = true;
  }
  await Purchases.logIn(userId);
}

export async function logoutPurchases(): Promise<void> {
  if (!configured || !isStoreBillingAvailable()) {
    return;
  }
  try {
    await Purchases.logOut();
  } catch {
    // 이미 익명 등 — 무시
  }
}

function packageForPackId(
  offering: PurchasesOffering | null,
  packId: CreditPackId
): PurchasesPackage | null {
  if (!offering) {
    return null;
  }
  const all = offering.availablePackages;
  const byProduct = all.find((p) => isCreditPackId(p.product.identifier) && p.product.identifier === packId);
  if (byProduct) {
    return byProduct;
  }
  const byPackageId = all.find((p) => p.identifier === packId || p.identifier.toLowerCase() === packId);
  return byPackageId ?? null;
}

export async function loadStoreCreditPacks(): Promise<StoreCreditPack[]> {
  if (!isStoreBillingAvailable()) {
    return CREDIT_PACK_IDS.map((id) => ({
      id,
      photos: CREDIT_PACK_CREDITS[id],
      priceLabel: CREDIT_PACK_FALLBACK_LABELS[id],
      rcPackage: null
    }));
  }

  let offering: PurchasesOffering | null = null;
  try {
    const offerings = await Purchases.getOfferings();
    offering = offerings.current;
  } catch {
    offering = null;
  }

  return CREDIT_PACK_IDS.map((id) => {
    const rcPackage = packageForPackId(offering, id);
    const priceLabel = rcPackage?.product.priceString ?? CREDIT_PACK_FALLBACK_LABELS[id];
    return {
      id,
      photos: CREDIT_PACK_CREDITS[id],
      priceLabel,
      rcPackage
    };
  });
}

export async function purchaseCreditPack(pack: StoreCreditPack): Promise<void> {
  if (!isStoreBillingAvailable()) {
    throw new Error("스토어 결제가 설정되지 않았어요. RevenueCat API 키를 확인해 주세요.");
  }
  if (!pack.rcPackage) {
    throw new Error(
      `스토어 상품(${pack.id})을 찾지 못했어요. RevenueCat Offering과 App Store / Play 상품 ID를 pack_1, pack_5, pack_10으로 맞춰 주세요.`
    );
  }
  try {
    await Purchases.purchasePackage(pack.rcPackage);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      throw new Error("결제가 취소됐어요.");
    }
    throw e;
  }
}

export async function restoreStorePurchases(): Promise<void> {
  if (!isStoreBillingAvailable()) {
    throw new Error("스토어 결제가 설정되지 않았어요.");
  }
  await Purchases.restorePurchases();
}
