import { existsSync, readdirSync, statSync } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getPublishedThemeBySlug } from "./themeCatalogDb";
import type { FaceSlotConfig } from "./themeTypes";

export type FaceSlotTemplate = {
  slug: string;
  backgroundFile?: string;
  backgroundUrl?: string;
  faceSlot: FaceSlotConfig;
  colorProfile: "warm" | "cool" | "neutral";
};

const DEFAULT_FACE_SLOT: FaceSlotConfig = {
  x: 0.5,
  y: 0.4,
  width: 0.22,
  height: 0.28,
  feather: 0.1
};

const FACE_SLOT_TUNING: Partial<Record<string, Pick<FaceSlotTemplate, "faceSlot" | "colorProfile">>> = {
  "100-days-teddy-bears": {
    faceSlot: { x: 0.5, y: 0.46, width: 0.19, height: 0.24, feather: 0.12 },
    colorProfile: "warm"
  },
  "100-days-ice-cream": {
    faceSlot: { x: 0.5, y: 0.41, width: 0.2, height: 0.28, feather: 0.1 },
    colorProfile: "cool"
  },
  "100-days-hanbok": {
    faceSlot: { x: 0.5, y: 0.46, width: 0.17, height: 0.22, feather: 0.1 },
    colorProfile: "neutral"
  },
  "100-days-hanbok-boy": {
    faceSlot: { x: 0.5, y: 0.46, width: 0.17, height: 0.22, feather: 0.1 },
    colorProfile: "neutral"
  },
  "horse-plush-newborn": {
    faceSlot: { x: 0.5, y: 0.39, width: 0.2, height: 0.24, feather: 0.08 },
    colorProfile: "warm"
  },
  "horse-zodiac-newborn": {
    faceSlot: { x: 0.5, y: 0.39, width: 0.2, height: 0.24, feather: 0.08 },
    colorProfile: "warm"
  },
  "newborn-horse": {
    faceSlot: { x: 0.5, y: 0.39, width: 0.2, height: 0.24, feather: 0.08 },
    colorProfile: "warm"
  },
  "first-birthday-girl": {
    faceSlot: { x: 0.5, y: 0.4, width: 0.22, height: 0.28, feather: 0.1 },
    colorProfile: "warm"
  },
  "first-birthday-boy": {
    faceSlot: { x: 0.5, y: 0.4, width: 0.22, height: 0.28, feather: 0.1 },
    colorProfile: "warm"
  },
  "summer-beach-girl": {
    faceSlot: { x: 0.5, y: 0.42, width: 0.2, height: 0.26, feather: 0.1 },
    colorProfile: "cool"
  },
  "summer-beach-boy": {
    faceSlot: { x: 0.5, y: 0.42, width: 0.2, height: 0.26, feather: 0.1 },
    colorProfile: "cool"
  },
  "summer-ice-cream-girl": {
    faceSlot: { x: 0.5, y: 0.41, width: 0.2, height: 0.28, feather: 0.1 },
    colorProfile: "cool"
  },
  "summer-ice-cream-boy": {
    faceSlot: { x: 0.5, y: 0.41, width: 0.2, height: 0.28, feather: 0.1 },
    colorProfile: "cool"
  },
  "summer-studio-girl": {
    faceSlot: { x: 0.5, y: 0.4, width: 0.22, height: 0.28, feather: 0.1 },
    colorProfile: "warm"
  },
  "summer-studio-boy": {
    faceSlot: { x: 0.5, y: 0.4, width: 0.22, height: 0.28, feather: 0.1 },
    colorProfile: "warm"
  }
};

const SUMMER_BACKGROUND_FILES: Record<string, string> = {
  "summer-beach-girl": "SummerBeachGirl.png",
  "summer-beach-boy": "SummerBeachBoy.png",
  "summer-ice-cream-girl": "SummerIceCreamGirl.png",
  "summer-ice-cream-boy": "SummerIceCreamBoy.png",
  "summer-studio-girl": "SummerStudioGirl.png",
  "summer-studio-boy": "SummerStudioBoy.png"
};

function getThemesAssetsRoot(): string {
  return path.resolve(process.cwd(), "../assets/themes");
}

let cachedThemeSubdirs: string[] | undefined;

function listThemeAssetSubdirs(): string[] {
  if (cachedThemeSubdirs !== undefined) return cachedThemeSubdirs;
  const root = getThemesAssetsRoot();
  try {
    const found = readdirSync(root)
      .filter((name) => !name.startsWith("."))
      .filter((name) => statSync(path.join(root, name)).isDirectory())
      .sort();
    cachedThemeSubdirs = found.length ? found : ["100day", "newborn", "summer", "birthday", "horse"];
  } catch {
    cachedThemeSubdirs = ["100day", "newborn", "summer", "birthday", "horse"];
  }
  return cachedThemeSubdirs;
}

function themeFileExistsInSubdir(fileName: string): boolean {
  const root = getThemesAssetsRoot();
  for (const dir of listThemeAssetSubdirs()) {
    if (existsSync(path.join(root, dir, fileName))) return true;
  }
  return false;
}

function resolveBackgroundFileCandidates(slug: string): string[] {
  if (slug === "100-days-hanbok-boy") return ["100-days-boy.png"];
  if (slug === "100-days-hanbok") return ["100-days-girl.png"];
  const summerFile = SUMMER_BACKGROUND_FILES[slug];
  if (summerFile) return [summerFile];
  if (slug === "first-birthday-girl") return ["first-birthday-girl-preview.png"];
  if (slug === "first-birthday-boy") return ["first-birthday-boy-preview.png"];
  if (slug === "horse-zodiac-newborn") return ["red-horse-zodiac.png", "newborn-horse.png"];
  if (slug === "horse-plush-newborn" || slug === "newborn-horse") return ["newborn-horse.png"];
  if (slug === "100-days-teddy-bears") return ["100-days-teddy-bears.png"];
  if (slug === "100-days-ice-cream") return ["100-days-ice-cream.png"];
  return [`${slug}.png`, `${slug}.jpg`];
}

async function readThemeAssetFile(fileName: string): Promise<Buffer> {
  const fromBackendCwd = getThemesAssetsRoot();
  const candidates = listThemeAssetSubdirs().map((dir) => path.join(fromBackendCwd, dir, fileName));
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return sharp(candidate).toBuffer();
    } catch {
      // continue
    }
  }
  throw new Error(`Theme asset not found for ${fileName}`);
}

export async function readThemeBackground(template: FaceSlotTemplate): Promise<Buffer> {
  if (template.backgroundUrl) {
    const res = await fetch(template.backgroundUrl);
    if (!res.ok) throw new Error(`Background fetch failed (${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) throw new Error("Background image is empty");
    return buf;
  }
  if (template.backgroundFile) {
    return readThemeAssetFile(template.backgroundFile);
  }
  throw new Error("Theme has no background");
}

export function applyGenderToFaceSlotTemplate(
  template: FaceSlotTemplate,
  gender?: string
): FaceSlotTemplate {
  if (template.slug === "100-days-hanbok-boy") return template;
  if (template.slug !== "100-days-hanbok") return template;
  const g = gender?.toLowerCase().trim();
  if (g === "boy" && template.backgroundFile) {
    return { ...template, backgroundFile: "100-days-boy.png" };
  }
  if (g === "boy" && template.backgroundUrl) {
    return template;
  }
  if (template.backgroundFile) {
    return { ...template, backgroundFile: "100-days-girl.png" };
  }
  return template;
}

function resolveBundledFaceSlot(slug: string): FaceSlotTemplate | undefined {
  const candidates = resolveBackgroundFileCandidates(slug);
  const backgroundFile = candidates.find(themeFileExistsInSubdir);
  if (!backgroundFile) return undefined;
  const tuning = FACE_SLOT_TUNING[slug];
  return {
    slug,
    backgroundFile,
    faceSlot: tuning?.faceSlot ?? DEFAULT_FACE_SLOT,
    colorProfile: tuning?.colorProfile ?? "neutral"
  };
}

export async function resolveFaceSlotTemplate(slug: string): Promise<FaceSlotTemplate | undefined> {
  const remote = await getPublishedThemeBySlug(slug);
  if (remote) {
    return {
      slug,
      backgroundUrl: remote.backgroundUrl,
      faceSlot: remote.faceSlot,
      colorProfile: remote.colorProfile
    };
  }
  return resolveBundledFaceSlot(slug);
}
