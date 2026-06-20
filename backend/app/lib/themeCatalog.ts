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
  { slug: "summer-beach-girl", name: "여름 해변 여아", category: "summer", defaultIsPremium: false },
  { slug: "summer-beach-boy", name: "여름 해변 남아", category: "summer", defaultIsPremium: false },
  { slug: "summer-ice-cream-girl", name: "여름 아이스크림 여아", category: "summer", defaultIsPremium: true },
  { slug: "summer-ice-cream-boy", name: "여름 아이스크림 남아", category: "summer", defaultIsPremium: true },
  { slug: "summer-studio-girl", name: "여름 스튜디오 여아", category: "summer", defaultIsPremium: true },
  { slug: "summer-studio-boy", name: "여름 스튜디오 남아", category: "summer", defaultIsPremium: true },
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
