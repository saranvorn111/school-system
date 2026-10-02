"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useT } from "./i18n-provider";

/** Sun/moon button that switches between the light and dark theme. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useT();
  return (
    <Button variant="ghost" size="icon" aria-label={t("navbar.theme")} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      <SunIcon className="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
      <MoonIcon className="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
    </Button>
  );
}
