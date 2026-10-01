"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { LOCALE_COOKIE, translate, type Locale, type TranslationKey } from "@/lib/i18n/dictionaries";

type I18n = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: TranslationKey) => string };

const I18nContext = createContext<I18n | null>(null);

/**
 * Holds the current language. The first value comes from the server (read from
 * the cookie), so the page is already in the right language when it loads.
 */
export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState(initialLocale);
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      router.refresh(); // re-render server components (e.g. the login page) in the new language
    },
    [router],
  );

  const value = useMemo(() => ({ locale, setLocale, t: (key: TranslationKey) => translate(locale, key) }), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** Translator for client components: `const t = useT()`. */
export const useT = () => useI18n().t;
