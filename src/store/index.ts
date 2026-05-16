import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CreateMode, SavedPhoto, Template } from "../types";

type AppState = {
  userId?: string;
  /** Stripe로 구매한 사진 크레딧(장). 서버 `user_credits`와 동기화 */
  photoCredits: number;
  isPremium: boolean;
  selectedTheme?: Template;
  selectedImageUri?: string;
  resultImageUri?: string;
  createMode?: CreateMode;
  selectedGender?: "girl" | "boy";
  localSavedPhotos: SavedPhoto[];
  /** 이번 달(서버 기준) 무료 생성 횟수 — Supabase `user_monthly_free_generations`와 동기화 */
  monthlyFreeUsed: number;
  /** 서버 `app_config.monthly_free_limit` (없으면 CONFIG 기본값) */
  monthlyFreeLimit?: number;
  /** 서버 `/api/themes/promotions` 스냅샷 */
  themePromotions?: { month: string; monthlyFreeLimit: number; premiumBySlug: Record<string, boolean> };
  setUserId: (id?: string) => void;
  setPhotoCredits: (n: number) => void;
  setPremium: (v: boolean) => void;
  setTheme: (template?: Template) => void;
  setSelectedImage: (uri?: string) => void;
  setResultImage: (uri?: string) => void;
  setCreateMode: (mode?: CreateMode) => void;
  setSelectedGender: (gender?: "girl" | "boy") => void;
  addLocalSavedPhoto: (url: string) => void;
  removeLocalSavedPhoto: (id: string) => void;
  setMonthlyFreeUsed: (n: number) => void;
  setMonthlyFreeLimit: (n?: number) => void;
  setThemePromotions: (p?: AppState["themePromotions"]) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      photoCredits: 0,
      isPremium: false,
      createMode: "face",
      localSavedPhotos: [],
      monthlyFreeUsed: 0,
      monthlyFreeLimit: undefined,
      themePromotions: undefined,
      setUserId: (userId) => set({ userId }),
      setPhotoCredits: (photoCredits) => set({ photoCredits }),
      setPremium: (isPremium) => set({ isPremium }),
      setTheme: (selectedTheme) => set({ selectedTheme }),
      setSelectedImage: (selectedImageUri) => set({ selectedImageUri }),
      setResultImage: (resultImageUri) => set({ resultImageUri }),
      setCreateMode: (createMode) => set({ createMode }),
      setSelectedGender: (selectedGender) => set({ selectedGender }),
      addLocalSavedPhoto: (url) =>
        set((state) => ({
          localSavedPhotos: [
            {
              id: `local-${Date.now()}`,
              result_url: url,
              created_at: new Date().toISOString()
            },
            ...state.localSavedPhotos
          ].slice(0, 20)
        })),
      removeLocalSavedPhoto: (id) =>
        set((state) => ({
          localSavedPhotos: state.localSavedPhotos.filter((p) => p.id !== id)
        })),
      setMonthlyFreeUsed: (monthlyFreeUsed) => set({ monthlyFreeUsed }),
      setMonthlyFreeLimit: (monthlyFreeLimit) => set({ monthlyFreeLimit }),
      setThemePromotions: (themePromotions) =>
        set({
          themePromotions,
          monthlyFreeLimit: themePromotions?.monthlyFreeLimit
        })
    }),
    {
      name: "moona-studio-app",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ localSavedPhotos: state.localSavedPhotos })
    }
  )
);
