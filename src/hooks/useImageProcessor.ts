import { useCallback, useState } from "react";
import { CONFIG, isAuthGateSatisfied } from "../constants/config";
import { processImage } from "../services/api";
import { localImageToJpegDataUrl, uploadUserImage } from "../services/storage";
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
    incrementFreeUsage
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
        incrementFreeUsage();
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
    [incrementFreeUsage, selectedGender, selectedImageUri, selectedTheme, setResultImage, userId]
  );

  return { run, loading, error, reset };
}
