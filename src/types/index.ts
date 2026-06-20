export type ColorProfile = "warm" | "cool" | "neutral";
export type CreateMode = "face" | "full";

export interface Template {
  name: string;
  slug: string;
  backgroundUrl: string;
  isPremium: boolean;
  category?: "free" | "newborn" | "summer" | "birthday" | "100day" | "horse" | "other";
  gender?: "girl" | "boy" | "unisex";
  previewImage?: any;
  babyPosition: { x: number; y: number; width: number; height: number };
  shadowOffset: { x: number; y: number };
  shadowBlur: number;
  shadowOpacity: number;
  colorProfile: ColorProfile;
  rotation?: number;
  brightness?: number;
  saturation?: number;
}

export type ProcessProvider = "openai-edit";

export interface ProcessRequest {
  /** Supabase Storage 등에 올린 뒤의 공개 URL (일반 플로우). */
  imageUrl?: string;
  /** `data:image/jpeg;base64,...` — Storage/익명 로그인 없이 백엔드로 직접 전달 (스킵·로컬 계정 등). */
  imageDataUrl?: string;
  themeSlug: string;
  userId: string;
  /** Backend is OpenAI-only now; left optional for API compatibility. */
  provider?: ProcessProvider;
  /** Hanbok boy/girl asset selection on backend */
  gender?: "girl" | "boy" | string;
  /** Optional label for logs / prompts */
  variant?: string;
}

export interface ProcessResponse {
  success: boolean;
  provider: ProcessProvider;
  resultImageDataUrl?: string;
  resultImageUrl?: string;
  error?: string;
  fallbackReason?: string;
  processingTimeMs?: number;
  usedFaceSlot?: boolean;
  themeSlug?: string;
  gender?: string;
  variant?: string;
  /** @deprecated use resultImageDataUrl */
  resultUrl?: string;
  /** @deprecated use processingTimeMs */
  processingTime?: number;
  fallbackToOriginal?: boolean;
  message?: string;
}

export interface ThemeRecord {
  id: string;
  name: string;
  slug: string;
  background_url: string;
  thumbnail_url: string;
  is_premium: boolean;
  category?: string;
  template: Template;
}

export interface SavedPhoto {
  id: string;
  result_url: string;
  created_at: string;
}
