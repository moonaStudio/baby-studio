import { Template } from "../types";
import Girl100dayPreview from "../../assets/themes/100day/100-days-girl.png";
import Boy100dayPreview from "../../assets/themes/100day/100-days-boy.png";
import IceCream100dayPreview from "../../assets/themes/100day/100-days-ice-cream.png";
import TeddyBears100dayPreview from "../../assets/themes/100day/100-days-teddy-bears.png";
import FirstBirthdayBoyPreview from "../../assets/themes/birthday/first-birthday-boy-preview.png";
import FirstBirthdayGirlPreview from "../../assets/themes/birthday/first-birthday-girl-preview.png";
import Month01BothPreview from "../../assets/themes/months/month-01-preview-both.png";
import Month02BoyPreview from "../../assets/themes/months/month-02-preview-boy.png";
import Month02GirlPreview from "../../assets/themes/months/month-02-preview.png";
import Month03BoyPreview from "../../assets/themes/months/month-03-preview-boy.png";
import Month03GirlPreview from "../../assets/themes/months/month-03-preview.png";
import Month04BoyPreview from "../../assets/themes/months/month-04-preview-boy.png";
import Month04GirlPreview from "../../assets/themes/months/month-04-preview.png";
import Month05BoyPreview from "../../assets/themes/months/month-05-preview-boy.png";
import Month05GirlPreview from "../../assets/themes/months/month-05-preview.png";
import Month06BoyPreview from "../../assets/themes/months/month-06-preview-boy.png";
import Month06GirlPreview from "../../assets/themes/months/month-06-preview.png";
import Month07BoyPreview from "../../assets/themes/months/month-07-preview-boy.png";
import Month07GirlPreview from "../../assets/themes/months/month-07-preview.png";
import Month08BoyPreview from "../../assets/themes/months/month-08-preview-boy.png";
import Month08GirlPreview from "../../assets/themes/months/month-08-preview.png";
import Month09BoyPreview from "../../assets/themes/months/month-09-preview-boy.png";
import Month09GirlPreview from "../../assets/themes/months/month-09-preview.png";
import Month10BoyPreview from "../../assets/themes/months/month-10-preview-boy.png";
import Month10GirlPreview from "../../assets/themes/months/month-10-preview.png";
import Month11BoyPreview from "../../assets/themes/months/month-11-preview-boy.png";
import Month11GirlPreview from "../../assets/themes/months/month-11-preview.png";
import Month12BoyPreview from "../../assets/themes/months/month-12-preview-boy.png";
import Month12GirlPreview from "../../assets/themes/months/month-12-preview.png";
import HorseSharedNewbornPreview from "../../assets/themes/horse/horse-newborn-shared-preview.png";
import NewbornHorsePreview from "../../assets/themes/newborn/newborn-horse.png";
import RedHorseZodiacPreview from "../../assets/themes/horse/red-horse-zodiac.png";

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
  makeTemplate("1월", "month-01-milestone", true, "neutral", "months", {
    gender: "unisex",
    previewImage: Month01BothPreview
  }),
  makeTemplate("2월 여아", "month-02-milestone-girl", true, "neutral", "months", {
    gender: "girl",
    previewImage: Month02GirlPreview
  }),
  makeTemplate("2월 남아", "month-02-milestone-boy", true, "neutral", "months", {
    gender: "boy",
    previewImage: Month02BoyPreview
  }),
  makeTemplate("3월 여아", "month-03-milestone-girl", true, "neutral", "months", {
    gender: "girl",
    previewImage: Month03GirlPreview
  }),
  makeTemplate("3월 남아", "month-03-milestone-boy", true, "neutral", "months", {
    gender: "boy",
    previewImage: Month03BoyPreview
  }),
  makeTemplate("4월 여아", "month-04-milestone-girl", true, "neutral", "months", {
    gender: "girl",
    previewImage: Month04GirlPreview
  }),
  makeTemplate("4월 남아", "month-04-milestone-boy", true, "neutral", "months", {
    gender: "boy",
    previewImage: Month04BoyPreview
  }),
  makeTemplate("5월 여아", "month-05-milestone-girl", false, "neutral", "months", {
    gender: "girl",
    previewImage: Month05GirlPreview
  }),
  makeTemplate("5월 남아", "month-05-milestone-boy", false, "neutral", "months", {
    gender: "boy",
    previewImage: Month05BoyPreview
  }),
  makeTemplate("6월 여아", "month-06-milestone-girl", true, "neutral", "months", {
    gender: "girl",
    previewImage: Month06GirlPreview
  }),
  makeTemplate("6월 남아", "month-06-milestone-boy", true, "neutral", "months", {
    gender: "boy",
    previewImage: Month06BoyPreview
  }),
  makeTemplate("7월 여아", "month-07-milestone-girl", true, "neutral", "months", {
    gender: "girl",
    previewImage: Month07GirlPreview
  }),
  makeTemplate("7월 남아", "month-07-milestone-boy", true, "neutral", "months", {
    gender: "boy",
    previewImage: Month07BoyPreview
  }),
  makeTemplate("8월 여아", "month-08-milestone-girl", true, "neutral", "months", {
    gender: "girl",
    previewImage: Month08GirlPreview
  }),
  makeTemplate("8월 남아", "month-08-milestone-boy", true, "neutral", "months", {
    gender: "boy",
    previewImage: Month08BoyPreview
  }),
  makeTemplate("9월 여아", "month-09-milestone-girl", true, "neutral", "months", {
    gender: "girl",
    previewImage: Month09GirlPreview
  }),
  makeTemplate("9월 남아", "month-09-milestone-boy", true, "neutral", "months", {
    gender: "boy",
    previewImage: Month09BoyPreview
  }),
  makeTemplate("10월 여아", "month-10-milestone-girl", true, "neutral", "months", {
    gender: "girl",
    previewImage: Month10GirlPreview
  }),
  makeTemplate("10월 남아", "month-10-milestone-boy", true, "neutral", "months", {
    gender: "boy",
    previewImage: Month10BoyPreview
  }),
  makeTemplate("11월 여아", "month-11-milestone-girl", true, "neutral", "months", {
    gender: "girl",
    previewImage: Month11GirlPreview
  }),
  makeTemplate("11월 남아", "month-11-milestone-boy", true, "neutral", "months", {
    gender: "boy",
    previewImage: Month11BoyPreview
  }),
  makeTemplate("12월 여아", "month-12-milestone-girl", true, "neutral", "months", {
    gender: "girl",
    previewImage: Month12GirlPreview
  }),
  makeTemplate("12월 남아", "month-12-milestone-boy", true, "neutral", "months", {
    gender: "boy",
    previewImage: Month12BoyPreview
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
