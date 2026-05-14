import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { CONFIG, effectiveIsPremium, isAuthGateSatisfied } from "../constants/config";
import { incrementMonthlyFreeUsage } from "../services/billing";
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
  const {
    userId,
    selectedTheme,
    selectedImageUri,
    selectedGender,
    setResultImage,
    setMonthlyFreeUsed,
    isPremium: storePremium
  } = useAppStore();

  const reset = useCallback(() => {
    setLoading(false);
    setError(undefined);
  }, []);

  const run = useCallback(
    async (options?: RunProcessOptions) => {
      if (!selectedTheme || !selectedImageUri) {
        setError("Missing image or theme. Please select both and try again.");
        return undefined;
      }
      if (!isAuthGateSatisfied(userId)) {
        setError("로그인이 필요해요. 로그인 후 다시 시도해 주세요.");
        return undefined;
      }

      if (
        selectedTheme &&
        !selectedTheme.isPremium &&
        !effectiveIsPremium(storePremium) &&
        useAppStore.getState().monthlyFreeUsed >= CONFIG.FREE_MONTHLY_LIMIT
      ) {
        setError("이번 달 무료 사진 한도를 모두 썼어요. 이용권 화면에서 크레딧이나 프리미엄을 확인해 주세요.");
        return undefined;
      }

      const effectiveUserId = userId ?? CONFIG.DEV_SKIP_USER_ID;
      const bypassStorage =
        CONFIG.SKIP_AUTH_FOR_DEV ||
        effectiveUserId === CONFIG.DEV_SKIP_USER_ID ||
        effectiveUserId.startsWith("local-");
      setLoading(true);
      setError(undefined);
      try {
        const result = bypassStorage
          ? await processImage({
              imageDataUrl: await localImageToJpegDataUrl(selectedImageUri),
              themeSlug: selectedTheme.slug,
              userId: effectiveUserId,
              provider: "openai-edit",
              gender: selectedGender,
              variant: options?.variant
            })
          : await processImage({
              imageUrl: await uploadUserImage(effectiveUserId, selectedImageUri),
              themeSlug: selectedTheme.slug,
              userId: effectiveUserId,
              provider: "openai-edit",
              gender: selectedGender,
              variant: options?.variant
            });
        const out = result.resultImageDataUrl ?? result.resultUrl ?? "";
        setResultImage(out);

        const premiumBypass = effectiveIsPremium(storePremium);
        if (!premiumBypass) {
          if (CONFIG.SKIP_AUTH_FOR_DEV) {
            setMonthlyFreeUsed(useAppStore.getState().monthlyFreeUsed + 1);
          } else if (
            userId &&
            !userId.startsWith("local-") &&
            userId !== CONFIG.DEV_SKIP_USER_ID
          ) {
            try {
              const {
                data: { session }
              } = await supabase.auth.getSession();
              if (session?.access_token) {
                const { used } = await incrementMonthlyFreeUsage(session.access_token);
                setMonthlyFreeUsed(used);
              }
            } catch {
              Alert.alert(
                "알림",
                "이번 달 무료 이용 횟수를 서버에 반영하지 못했어요. 네트워크 확인 후 앱을 다시 열어 주세요."
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
    },
    [
      selectedGender,
      selectedImageUri,
      selectedTheme,
      setMonthlyFreeUsed,
      setResultImage,
      storePremium,
      userId
    ]
  );

  return { run, loading, error, reset };
}
