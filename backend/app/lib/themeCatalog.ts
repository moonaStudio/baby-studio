/** Keep in sync with `src/constants/themes.ts` (slug + default isPremium). */
export type ThemeCatalogEntry = {
  slug: string;
  name: string;
  category: string;
  defaultIsPremium: boolean;
};

export const THEME_CATALOG: ThemeCatalogEntry[] = [
  { slug: "newborn-horse", name: "신생아 말 인형", category: "newborn", defaultIsPremium: true },
  { slug: "horse-plush-newborn", name: "신생아 말 플러시", category: "newborn", defaultIsPremium: true },
  { slug: "horse-zodiac-newborn", name: "붉은 말띠", category: "horse", defaultIsPremium: true },
  { slug: "month-01-milestone", name: "1월", category: "months", defaultIsPremium: true },
  { slug: "month-02-milestone-girl", name: "2월 여아", category: "months", defaultIsPremium: true },
  { slug: "month-02-milestone-boy", name: "2월 남아", category: "months", defaultIsPremium: true },
  { slug: "month-03-milestone-girl", name: "3월 여아", category: "months", defaultIsPremium: true },
  { slug: "month-03-milestone-boy", name: "3월 남아", category: "months", defaultIsPremium: true },
  { slug: "month-04-milestone-girl", name: "4월 여아", category: "months", defaultIsPremium: true },
  { slug: "month-04-milestone-boy", name: "4월 남아", category: "months", defaultIsPremium: true },
  { slug: "month-05-milestone-girl", name: "5월 여아", category: "months", defaultIsPremium: false },
  { slug: "month-05-milestone-boy", name: "5월 남아", category: "months", defaultIsPremium: false },
  { slug: "month-06-milestone-girl", name: "6월 여아", category: "months", defaultIsPremium: true },
  { slug: "month-06-milestone-boy", name: "6월 남아", category: "months", defaultIsPremium: true },
  { slug: "month-07-milestone-girl", name: "7월 여아", category: "months", defaultIsPremium: true },
  { slug: "month-07-milestone-boy", name: "7월 남아", category: "months", defaultIsPremium: true },
  { slug: "month-08-milestone-girl", name: "8월 여아", category: "months", defaultIsPremium: true },
  { slug: "month-08-milestone-boy", name: "8월 남아", category: "months", defaultIsPremium: true },
  { slug: "month-09-milestone-girl", name: "9월 여아", category: "months", defaultIsPremium: true },
  { slug: "month-09-milestone-boy", name: "9월 남아", category: "months", defaultIsPremium: true },
  { slug: "month-10-milestone-girl", name: "10월 여아", category: "months", defaultIsPremium: true },
  { slug: "month-10-milestone-boy", name: "10월 남아", category: "months", defaultIsPremium: true },
  { slug: "month-11-milestone-girl", name: "11월 여아", category: "months", defaultIsPremium: true },
  { slug: "month-11-milestone-boy", name: "11월 남아", category: "months", defaultIsPremium: true },
  { slug: "month-12-milestone-girl", name: "12월 여아", category: "months", defaultIsPremium: true },
  { slug: "month-12-milestone-boy", name: "12월 남아", category: "months", defaultIsPremium: true },
  { slug: "first-birthday-girl", name: "돌사진 여아", category: "birthday", defaultIsPremium: true },
  { slug: "first-birthday-boy", name: "돌사진 남아", category: "birthday", defaultIsPremium: true },
  { slug: "100-days-ice-cream", name: "100일 아이스크림", category: "100day", defaultIsPremium: true },
  { slug: "100-days-teddy-bears", name: "100일 테디베어", category: "100day", defaultIsPremium: true },
  { slug: "100-days-hanbok", name: "100일 한복 여아", category: "100day", defaultIsPremium: false },
  { slug: "100-days-hanbok-boy", name: "100일 한복 남아", category: "100day", defaultIsPremium: false }
];

const bySlug = new Map(THEME_CATALOG.map((t) => [t.slug, t]));

export function getCatalogEntry(slug: string): ThemeCatalogEntry | undefined {
  return bySlug.get(slug);
}
