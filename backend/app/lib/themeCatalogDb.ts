import { getSupabaseAdmin } from "./supabaseAdmin";
import { THEME_CATALOG } from "./themeCatalog";
import {
  DEFAULT_FACE_SLOT,
  type FaceSlotConfig,
  type ThemeCatalogDto,
  type ThemeCatalogRow,
  normalizeFaceSlot,
  rowToDto
} from "./themeTypes";

export async function listAllThemesAdmin(): Promise<ThemeCatalogDto[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("themes_catalog")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true });
  if (error) throw error;
  return (data as ThemeCatalogRow[]).map(rowToDto);
}

export async function listPublishedThemes(): Promise<ThemeCatalogDto[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("themes_catalog")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true });
  if (error) throw error;
  return (data as ThemeCatalogRow[]).map(rowToDto);
}

export async function getPublishedThemeBySlug(slug: string): Promise<ThemeCatalogDto | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("themes_catalog")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToDto(data as ThemeCatalogRow) : null;
}

export async function upsertTheme(input: {
  slug: string;
  name: string;
  category: string;
  gender: "girl" | "boy" | "unisex";
  defaultIsPremium: boolean;
  isPublished: boolean;
  previewUrl?: string | null;
  backgroundUrl: string;
  faceSlot?: FaceSlotConfig;
  colorProfile?: "warm" | "cool" | "neutral";
  sortOrder?: number;
}): Promise<ThemeCatalogDto> {
  const slug = input.slug.trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("slug는 영문 소문자, 숫자, 하이픈만 사용하세요.");
  }
  if (!input.backgroundUrl.trim()) {
    throw new Error("backgroundUrl이 필요합니다.");
  }

  const row = {
    slug,
    name: input.name.trim(),
    category: input.category.trim() || "other",
    gender: input.gender,
    default_is_premium: input.defaultIsPremium,
    is_published: input.isPublished,
    preview_url: input.previewUrl?.trim() || null,
    background_url: input.backgroundUrl.trim(),
    face_slot: input.faceSlot ?? DEFAULT_FACE_SLOT,
    color_profile: input.colorProfile ?? "neutral",
    sort_order: input.sortOrder ?? 0,
    updated_at: new Date().toISOString()
  };

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("themes_catalog").upsert(row).select("*").single();
  if (error) throw error;
  return rowToDto(data as ThemeCatalogRow);
}

export async function deleteTheme(slug: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("themes_catalog").delete().eq("slug", slug);
  if (error) throw error;
}

export function publicStorageUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const clean = path.replace(/^\//, "");
  return `${base}/storage/v1/object/public/theme-assets/${clean}`;
}

export async function uploadThemeAsset(
  slug: string,
  kind: "preview" | "background",
  bytes: Buffer,
  contentType: string
): Promise<string> {
  const ext =
    contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const objectPath = `themes/${slug}/${kind}.${ext}`;
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage.from("theme-assets").upload(objectPath, bytes, {
    contentType,
    upsert: true
  });
  if (error) throw error;
  return publicStorageUrl(objectPath);
}

/** Bundled + remote slugs for promotions admin. */
export function allKnownThemeSlugs(remote: ThemeCatalogDto[]): string[] {
  const set = new Set(THEME_CATALOG.map((t) => t.slug));
  for (const r of remote) set.add(r.slug);
  return [...set];
}

export function catalogEntryForPromotions(
  slug: string,
  remote: ThemeCatalogDto[]
): { slug: string; name: string; category: string; defaultIsPremium: boolean } | undefined {
  const r = remote.find((t) => t.slug === slug);
  if (r) {
    return { slug: r.slug, name: r.name, category: r.category, defaultIsPremium: r.defaultIsPremium };
  }
  const b = THEME_CATALOG.find((t) => t.slug === slug);
  if (b) return b;
  return undefined;
}

export { normalizeFaceSlot };
