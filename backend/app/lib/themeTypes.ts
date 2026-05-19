export type FaceSlotConfig = {
  x: number;
  y: number;
  width: number;
  height: number;
  feather: number;
};

export const DEFAULT_FACE_SLOT: FaceSlotConfig = {
  x: 0.5,
  y: 0.4,
  width: 0.22,
  height: 0.28,
  feather: 0.1
};

export type ThemeCatalogRow = {
  slug: string;
  name: string;
  category: string;
  gender: "girl" | "boy" | "unisex";
  default_is_premium: boolean;
  is_published: boolean;
  preview_url: string | null;
  background_url: string;
  face_slot: FaceSlotConfig;
  color_profile: "warm" | "cool" | "neutral";
  sort_order: number;
};

export type ThemeCatalogDto = {
  slug: string;
  name: string;
  category: string;
  gender: "girl" | "boy" | "unisex";
  defaultIsPremium: boolean;
  isPublished: boolean;
  previewUrl: string | null;
  backgroundUrl: string;
  faceSlot: FaceSlotConfig;
  colorProfile: "warm" | "cool" | "neutral";
  sortOrder: number;
};

export function rowToDto(row: ThemeCatalogRow): ThemeCatalogDto {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category,
    gender: row.gender,
    defaultIsPremium: row.default_is_premium,
    isPublished: row.is_published,
    previewUrl: row.preview_url,
    backgroundUrl: row.background_url,
    faceSlot: normalizeFaceSlot(row.face_slot),
    colorProfile: row.color_profile,
    sortOrder: row.sort_order
  };
}

export function normalizeFaceSlot(raw: unknown): FaceSlotConfig {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const num = (k: string, fallback: number) => {
    const v = o[k];
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  return {
    x: num("x", DEFAULT_FACE_SLOT.x),
    y: num("y", DEFAULT_FACE_SLOT.y),
    width: num("width", DEFAULT_FACE_SLOT.width),
    height: num("height", DEFAULT_FACE_SLOT.height),
    feather: num("feather", DEFAULT_FACE_SLOT.feather)
  };
}
