export const CATEGORIES = ['cryptid', 'ufo', 'extraterrestrial', 'ghost', 'spirit', 'occult'] as const
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABEL: Record<Category, string> = {
  cryptid: 'Cryptid',
  ufo: 'UFO / UAP',
  extraterrestrial: 'Alien',
  ghost: 'Ghost',
  spirit: 'Spirit & jinn',
  occult: 'Occult',
}

export const CATEGORY_LONG: Record<Category, string> = {
  cryptid: 'Cryptid',
  ufo: 'UFO / UAP',
  extraterrestrial: 'Extraterrestrial',
  ghost: 'Ghost / haunting',
  spirit: 'Spirits & jinn',
  occult: 'Occult & secret societies',
}

/** What the form asks: plain-language versions of each category. */
export const CATEGORY_PROMPT: Record<Category, {title: string; hint: string}> = {
  cryptid: {title: 'A creature', hint: 'Bigfoot, Mothman, something in the lake'},
  ufo: {title: 'Strange lights or a craft', hint: 'Something in the sky that should not be there'},
  extraterrestrial: {title: 'An alien encounter', hint: 'A figure, a being, a visitor'},
  ghost: {title: 'A ghost or haunting', hint: 'A figure on the stairs, knocking in the walls'},
  spirit: {title: 'A spirit or jinn', hint: 'A presence, described in your own terms'},
  occult: {title: 'Occult or a secret society', hint: 'A ritual, a strange gathering, an unlisted hall'},
}

export const isCategory = (v: unknown): v is Category => typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v)

/** Categories where the Bureau records belief as the witness holds it. Drives a respectful banner. */
export const isFaithSensitive = (c: string | undefined | null) => c === 'spirit'
