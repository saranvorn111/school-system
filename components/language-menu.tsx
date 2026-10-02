"use client";

import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { localeNames, locales } from "@/lib/i18n/dictionaries";
import { FlagIcon } from "./flag-icon";
import { useI18n } from "./i18n-provider";

/** Language switcher (English / ខ្មែរ) shown as a flag. The choice is remembered in a cookie. */
export function LanguageMenu() {
  const { locale, setLocale, t } = useI18n();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`${t("navbar.language")}: ${localeNames[locale]}`}>
          <FlagIcon locale={locale} />
          <span className="hidden sm:inline">{localeNames[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel>{t("navbar.language")}</DropdownMenuLabel>
        {locales.map((l) => (
          <DropdownMenuItem key={l} onSelect={() => setLocale(l)} lang={l}>
            <FlagIcon locale={l} />
            {localeNames[l]}
            {l === locale && <CheckIcon className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
