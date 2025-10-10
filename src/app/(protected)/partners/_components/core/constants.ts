export const COL_WIDTHS = {
  select: 32,
  image: 100,
  name: 140,
  link: 140,
  actions: 80,
} as const;

export const ukCollator = new Intl.Collator('uk', { sensitivity: 'base', ignorePunctuation: true });
