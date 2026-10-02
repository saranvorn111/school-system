import en from "@/messages/en.json";
import km from "@/messages/km.json";

/**
 * Translations live in `messages/en.json` and `messages/km.json`.
 *
 * To add text:
 *   1. add it to `messages/en.json` (nest it under a group, e.g. "nav" → "reports"),
 *   2. add the same key to `messages/km.json` — TypeScript reports an error if it is missing,
 *   3. use it with a dotted key: `t("nav.reports")`
 *      (`const t = useT()` in client components, `const t = await getT()` in server components).
 */
export const locales = ["en", "km"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "locale";

export const localeNames: Record<Locale, string> = { en: "English", km: "ខ្មែរ" };

type Messages = typeof en;

/** Every dotted path to a string in en.json, e.g. "nav.group.admin". */
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`;
}[keyof T & string];
export type TranslationKey = Paths<Messages>;

// Typing km as `Messages` makes a missing or misspelled Khmer key a compile error.
const messages: Record<Locale, Messages> = { en, km };

export const isLocale = (value: unknown): value is Locale => locales.includes(value as Locale);

function lookup(tree: unknown, key: string): string | undefined {
  let node = tree;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

/** Text for `key` in `locale`, falling back to English and then to the key itself. */
export function translate(locale: Locale, key: TranslationKey): string {
  return lookup(messages[locale], key) ?? lookup(messages[defaultLocale], key) ?? key;
}
