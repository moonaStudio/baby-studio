import { create } from "zustand";
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
};

export const useAppStore = create<AppState>((set) => ({
  photoCredits: 0,
  isPremium: false,
  createMode: "face",
  localSavedPhotos: [],
  monthlyFreeUsed: 0,
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
  setMonthlyFreeUsed: (monthlyFreeUsed) => set({ monthlyFreeUsed })
}));
