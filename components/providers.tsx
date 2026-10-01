"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ApiClientError } from "@/lib/api/client";
import type { Locale } from "@/lib/i18n/dictionaries";
import { I18nProvider } from "./i18n-provider";

export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Don't retry "you can't see this" or "not found" — only flaky network/server errors.
            retry: (count, error) => count < 2 && ((error as ApiClientError).status ?? 500) >= 500,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <I18nProvider initialLocale={locale}>
          <TooltipProvider>{children}</TooltipProvider>
        </I18nProvider>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
