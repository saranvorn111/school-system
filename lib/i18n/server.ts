import "server-only";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, translate, type Locale, type TranslationKey } from "./dictionaries";

/** The language chosen in the navbar, remembered in a cookie. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/** Translator for server components: `const t = await getT()`. */
export async function getT() {
  const locale = await getLocale();
  return (key: TranslationKey) => translate(locale, key);
}
