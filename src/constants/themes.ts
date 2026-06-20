import { Template } from "../types";
import Girl100dayPreview from "../../assets/themes/100day/100-days-girl.png";
import Boy100dayPreview from "../../assets/themes/100day/100-days-boy.png";
import IceCream100dayPreview from "../../assets/themes/100day/100-days-ice-cream.png";
import TeddyBears100dayPreview from "../../assets/themes/100day/100-days-teddy-bears.png";
import FirstBirthdayBoyPreview from "../../assets/themes/birthday/first-birthday-boy-preview.png";
import FirstBirthdayGirlPreview from "../../assets/themes/birthday/first-birthday-girl-preview.png";
import HorseSharedNewbornPreview from "../../assets/themes/horse/horse-newborn-shared-preview.png";
import NewbornHorsePreview from "../../assets/themes/newborn/newborn-horse.png";
import RedHorseZodiacPreview from "../../assets/themes/horse/red-horse-zodiac.png";
import SummerBeachBoyPreview from "../../assets/themes/summer/SummerBeachBoy.png";
import SummerBeachGirlPreview from "../../assets/themes/summer/SummerBeachGirl.png";
import SummerIceCreamBoyPreview from "../../assets/themes/summer/SummerIceCreamBoy.png";
import SummerIceCreamGirlPreview from "../../assets/themes/summer/SummerIceCreamGirl.png";
import SummerStudioBoyPreview from "../../assets/themes/summer/SummerStudioBoy.png";
import SummerStudioGirlPreview from "../../assets/themes/summer/SummerStudioGirl.png";

const makeTemplate = (
  name: string,
  slug: string,
  isPremium: boolean,
  colorProfile: Template["colorProfile"],
  category: Template["category"],
  options?: Pick<Template, "gender" | "previewImage">
): Template => ({
  name,
  slug,
  backgroundUrl: `https://cdn.example.com/themes/${slug}.jpg`,
  isPremium,
  category,
  gender: options?.gender ?? "unisex",
  previewImage: options?.previewImage,
  babyPosition: { x: 0.5, y: 0.62, width: 0.5, height: 0.6 },
  shadowOffset: { x: 12, y: 20 },
  shadowBlur: 18,
  shadowOpacity: 0.3,
  colorProfile,
  brightness: 1,
  saturation: 1
});

export const THEME_TEMPLATES: Template[] = [
  makeTemplate("신생아 말 인형", "newborn-horse", true, "warm", "newborn", {
    gender: "unisex",
    previewImage: NewbornHorsePreview
  }),
  makeTemplate("신생아 말 플러시", "horse-plush-newborn", true, "warm", "newborn", {
    gender: "unisex",
    previewImage: HorseSharedNewbornPreview
  }),
  makeTemplate("붉은 말띠", "horse-zodiac-newborn", true, "warm", "horse", {
    gender: "unisex",
    previewImage: RedHorseZodiacPreview
  }),
  makeTemplate("여름 해변 여아", "summer-beach-girl", false, "cool", "summer", {
    gender: "girl",
    previewImage: SummerBeachGirlPreview
  }),
  makeTemplate("여름 해변 남아", "summer-beach-boy", false, "cool", "summer", {
    gender: "boy",
    previewImage: SummerBeachBoyPreview
  }),
  makeTemplate("여름 아이스크림 여아", "summer-ice-cream-girl", true, "cool", "summer", {
    gender: "girl",
    previewImage: SummerIceCreamGirlPreview
  }),
  makeTemplate("여름 아이스크림 남아", "summer-ice-cream-boy", true, "cool", "summer", {
    gender: "boy",
    previewImage: SummerIceCreamBoyPreview
  }),
  makeTemplate("여름 스튜디오 여아", "summer-studio-girl", true, "warm", "summer", {
    gender: "girl",
    previewImage: SummerStudioGirlPreview
  }),
  makeTemplate("여름 스튜디오 남아", "summer-studio-boy", true, "warm", "summer", {
    gender: "boy",
    previewImage: SummerStudioBoyPreview
  }),
  makeTemplate("돌사진 여아", "first-birthday-girl", true, "warm", "birthday", {
    gender: "girl",
    previewImage: FirstBirthdayGirlPreview
  }),
  makeTemplate("돌사진 남아", "first-birthday-boy", true, "warm", "birthday", {
    gender: "boy",
    previewImage: FirstBirthdayBoyPreview
  }),
  makeTemplate("100일 아이스크림", "100-days-ice-cream", true, "cool", "100day", {
    gender: "unisex",
    previewImage: IceCream100dayPreview
  }),
  makeTemplate("100일 테디베어", "100-days-teddy-bears", true, "warm", "100day", {
    gender: "unisex",
    previewImage: TeddyBears100dayPreview
  }),
  makeTemplate("100일 한복 여아", "100-days-hanbok", false, "neutral", "100day", {
    gender: "girl",
    previewImage: Girl100dayPreview
  }),
  makeTemplate("100일 한복 남아", "100-days-hanbok-boy", false, "neutral", "100day", {
    gender: "boy",
    previewImage: Boy100dayPreview
  })
];
