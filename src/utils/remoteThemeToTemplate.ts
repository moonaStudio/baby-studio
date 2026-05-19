import { ColorProfile, Template } from "../types";

export type RemoteThemeDto = {
  slug: string;
  name: string;
  category: string;
  gender: "girl" | "boy" | "unisex";
  defaultIsPremium: boolean;
  previewUrl: string | null;
  backgroundUrl: string;
  colorProfile: ColorProfile;
  sortOrder?: number;
};

export function remoteThemeToTemplate(dto: RemoteThemeDto, isPremium: boolean): Template {
  return {
    name: dto.name,
    slug: dto.slug,
    backgroundUrl: dto.backgroundUrl,
    isPremium,
    category: dto.category as Template["category"],
    gender: dto.gender,
    previewImage: dto.previewUrl ? { uri: dto.previewUrl } : { uri: dto.backgroundUrl },
    babyPosition: { x: 0.5, y: 0.62, width: 0.5, height: 0.6 },
    shadowOffset: { x: 12, y: 20 },
    shadowBlur: 18,
    shadowOpacity: 0.3,
    colorProfile: dto.colorProfile,
    brightness: 1,
    saturation: 1
  };
}
