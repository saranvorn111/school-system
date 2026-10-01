import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarCheckIcon, ClipboardCheckIcon, GraduationCapIcon, ShieldCheckIcon } from "lucide-react";
import { homePathFor } from "@/lib/auth/authz";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getT } from "@/lib/i18n/server";
import { LanguageMenu } from "@/components/language-menu";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

const FEATURES = [
  { icon: CalendarCheckIcon, title: "login.feature1.title", text: "login.feature1.text" },
  { icon: ClipboardCheckIcon, title: "login.feature2.title", text: "login.feature2.text" },
  { icon: ShieldCheckIcon, title: "login.feature3.title", text: "login.feature3.text" },
] as const;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user));
  const { next } = await searchParams;
  const t = await getT();

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — hidden on small screens so the form comes first */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-violet-400/20 blur-3xl" aria-hidden />

        <div className="relative flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <GraduationCapIcon className="size-5" />
          </div>
          <span className="text-lg font-semibold">{t("app.name")}</span>
        </div>

        <div className="relative space-y-8">
          <h1 className="max-w-md text-4xl leading-tight font-semibold tracking-tight">{t("login.hero")}</h1>
          <ul className="space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <f.icon className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{t(f.title)}</p>
                  <p className="text-sm text-indigo-100">{t(f.text)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-indigo-200">{t("login.audience")}</p>
      </section>

      <section className="relative flex items-center justify-center px-6 py-12">
        <div className="absolute top-4 right-4">
          <LanguageMenu />
        </div>
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:hidden">
              <GraduationCapIcon className="size-5" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">{t("login.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
          </div>
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>
      </section>
    </main>
  );
}
