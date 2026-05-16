import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { CONFIG, canAccessPremiumThemes, effectiveIsPremium, isAuthGateSatisfied } from "../constants/config";
import { getMonthlyFreeLimit } from "../constants/monthlyFreeLimit";
import { consumePhotoCredit, incrementMonthlyFreeUsage } from "../services/billing";
import { processImage } from "../services/api";
import { localImageToJpegDataUrl, uploadUserImage } from "../services/storage";
import { supabase } from "../services/supabase";
import { useAppStore } from "../store";

export type RunProcessOptions = {
  variant?: string;
};

export function useImageProcessor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const reset = useCallback(() => {
    setLoading(false);
    setError(undefined);
  }, []);

  /** 항상 스토어 최신값으로 한 번에 처리(테마 변경 직후·탭 전환 후에도 이전 테마로 생성되지 않게). */
  const run = useCallback(async (options?: RunProcessOptions) => {
    const s = useAppStore.getState();
    const {
      userId: uid,
      selectedTheme: theme,
      selectedImageUri: imageUri,
      selectedGender: gender,
      isPremium: snapPremium,
      setResultImage: putResult,
      setMonthlyFreeUsed: putMonthly,
      setPhotoCredits: putCredits
    } = s;

    if (!theme || !imageUri) {
      setError("Missing image or theme. Please select both and try again.");
      return undefined;
    }
    if (!isAuthGateSatisfied(uid)) {
      setError("로그인이 필요해요. 로그인 후 다시 시도해 주세요.");
      return undefined;
    }

    if (
      theme.isPremium &&
      !canAccessPremiumThemes(snapPremium, useAppStore.getState().photoCredits)
    ) {
      setError("프리미엄 테마는 구독 또는 사진 크레딧 1장이 필요해요.");
      return undefined;
    }

    if (
      !theme.isPremium &&
      !effectiveIsPremium(snapPremium) &&
      useAppStore.getState().monthlyFreeUsed >= getMonthlyFreeLimit()
    ) {
      setError("이번 달 무료 사진 한도를 모두 썼어요. 이용권 화면에서 크레딧이나 프리미엄을 확인해 주세요.");
      return undefined;
    }

    const effectiveUserId = uid ?? CONFIG.DEV_SKIP_USER_ID;
    const bypassStorage =
      CONFIG.SKIP_AUTH_FOR_DEV ||
      effectiveUserId === CONFIG.DEV_SKIP_USER_ID ||
      effectiveUserId.startsWith("local-");
    setLoading(true);
    setError(undefined);
    try {
      const result = bypassStorage
        ? await processImage({
            imageDataUrl: await localImageToJpegDataUrl(imageUri),
            themeSlug: theme.slug,
            userId: effectiveUserId,
            provider: "openai-edit",
            gender: gender,
            variant: options?.variant
          })
        : await processImage({
            imageUrl: await uploadUserImage(effectiveUserId, imageUri),
            themeSlug: theme.slug,
            userId: effectiveUserId,
            provider: "openai-edit",
            gender: gender,
            variant: options?.variant
          });
      const out = result.resultImageDataUrl ?? result.resultUrl ?? "";
      putResult(out);

      const premiumBypass = effectiveIsPremium(snapPremium);
      if (!premiumBypass) {
        if (!theme.isPremium) {
          if (CONFIG.SKIP_AUTH_FOR_DEV) {
            putMonthly(useAppStore.getState().monthlyFreeUsed + 1);
          } else if (
            uid &&
            !uid.startsWith("local-") &&
            uid !== CONFIG.DEV_SKIP_USER_ID
          ) {
            try {
              const {
                data: { session }
              } = await supabase.auth.getSession();
              if (session?.access_token) {
                const { used } = await incrementMonthlyFreeUsage(session.access_token);
                putMonthly(used);
              }
            } catch {
              Alert.alert(
                "알림",
                "이번 달 무료 이용 횟수를 서버에 반영하지 못했어요. 네트워크 확인 후 앱을 다시 열어 주세요."
              );
            }
          }
        } else if (
          !CONFIG.SKIP_AUTH_FOR_DEV &&
          uid &&
          !uid.startsWith("local-") &&
          uid !== CONFIG.DEV_SKIP_USER_ID
        ) {
          try {
            const {
              data: { session }
            } = await supabase.auth.getSession();
            if (session?.access_token) {
              const bal = await consumePhotoCredit(session.access_token);
              if (bal === null) {
                Alert.alert("크레딧", "차감할 크레딧이 부족해요. 이용권 화면에서 확인해 주세요.");
              } else {
                putCredits(bal);
              }
            }
          } catch (e) {
            const detail = e instanceof Error ? e.message : "";
            Alert.alert(
              "크레딧 차감",
              detail || "크레딧 차감에 실패했어요. 네트워크를 확인하거나 잠시 후 다시 시도해 주세요."
            );
          }
        }
      }

      return out || undefined;
    } catch (e: any) {
      setError(
        e?.message ? `Processing failed: ${e.message}` : "Processing failed. Please try again."
      );
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  return { run, loading, error, reset };
}
