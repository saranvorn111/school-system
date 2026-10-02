import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BarChart3Icon,
  BuildingIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClipboardCheckIcon,
  CodeIcon,
  GraduationCapIcon,
  KeyRoundIcon,
  LockIcon,
  PresentationIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { LanguageMenu } from "@/components/language-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { homePathFor } from "@/lib/auth/authz";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { locales, type TranslationKey } from "@/lib/i18n/dictionaries";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "School System — University and school management",
  description: "Students, teachers, classes, attendance and grades in one secure system with role-based access.",
};

type Feature = { icon: LucideIcon; key: "users" | "academics" | "timetable" | "attendance" | "grades" | "reports"; tone: string };

const FEATURES: Feature[] = [
  { icon: UsersIcon, key: "users", tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  { icon: BuildingIcon, key: "academics", tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  { icon: CalendarDaysIcon, key: "timetable", tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  { icon: CalendarCheckIcon, key: "attendance", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { icon: GraduationCapIcon, key: "grades", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { icon: BarChart3Icon, key: "reports", tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
];

const PORTALS = [
  { icon: ShieldCheckIcon, key: "admin" },
  { icon: PresentationIcon, key: "teacher" },
  { icon: GraduationCapIcon, key: "student" },
] as const;

const SECURITY = [
  { icon: KeyRoundIcon, key: "permissions" },
  { icon: ScrollTextIcon, key: "audit" },
  { icon: LockIcon, key: "accounts" },
  { icon: CodeIcon, key: "api" },
] as const;

const STEPS = ["step1", "step2", "step3", "step4"] as const;
const ITEMS = ["item1", "item2", "item3", "item4"] as const;

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      <p className="mt-4 text-lg text-pretty text-muted-foreground">{subtitle}</p>
    </div>
  );
}

/** A drawn (not screenshot) preview of the admin dashboard, so it always matches the theme. */
function DashboardPreview({ label }: { label: string }) {
  const stats = [
    { icon: GraduationCapIcon, value: "1,248", tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
    { icon: UsersIcon, value: "86", tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
    { icon: CalendarCheckIcon, value: "94%", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  ];
  const rows = [
    { code: "CS101-A", fill: "w-[92%]", status: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
    { code: "MATH101-A", fill: "w-[78%]", status: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    { code: "CS102-B", fill: "w-[64%]", status: "bg-muted text-muted-foreground" },
  ];
  return (
    <div role="img" aria-label={label} className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-indigo-500/20 via-violet-500/10 to-sky-400/20 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-indigo-950/10" aria-hidden>
        <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-3">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 h-5 flex-1 rounded-md bg-background" />
        </div>
        <div className="grid grid-cols-[3rem_1fr]">
          <div className="space-y-3 border-r bg-muted/30 p-3">
            <div className="size-6 rounded-md bg-primary" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-1.5 rounded-full ${i === 0 ? "bg-primary/60" : "bg-muted-foreground/20"}`} />
            ))}
          </div>
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-3 gap-3">
              {stats.map((s, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className={`mb-2 flex size-7 items-center justify-center rounded-lg ${s.tone}`}>
                    <s.icon className="size-4" />
                  </div>
                  <p className="text-lg font-semibold tabular-nums">{s.value}</p>
                  <div className="mt-1 h-1.5 w-12 rounded-full bg-muted" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border">
              {rows.map((r) => (
                <div key={r.code} className="flex items-center gap-3 border-b px-3 py-2.5 last:border-0">
                  <span className="w-20 font-mono text-xs">{r.code}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full bg-primary ${r.fill}`} />
                  </div>
                  <span className={`h-4 w-14 rounded-full ${r.status}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  const appHref = user ? homePathFor(user) : "/login";
  const appLabel = user ? t("landing.nav.dashboard") : t("landing.nav.login");

  const stats: { value: number; label: TranslationKey }[] = [
    { value: 3, label: "landing.stats.portals" },
    { value: Object.keys(PERMISSIONS).length, label: "landing.stats.permissions" },
    { value: locales.length, label: "landing.stats.languages" },
    { value: STEPS.length, label: "landing.stats.steps" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCapIcon className="size-5" />
            </span>
            <span className="text-base font-semibold">{t("app.name")}</span>
          </Link>
          <nav className="hidden flex-1 items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Sections">
            <a href="#features" className="transition-colors hover:text-foreground">{t("landing.nav.features")}</a>
            <a href="#portals" className="transition-colors hover:text-foreground">{t("landing.nav.portals")}</a>
            <a href="#workflow" className="transition-colors hover:text-foreground">{t("landing.nav.workflow")}</a>
            <a href="#security" className="transition-colors hover:text-foreground">{t("landing.nav.security")}</a>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <LanguageMenu />
            <ThemeToggle />
            <Button asChild className="ml-2">
              <Link href={appHref}>{appLabel}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_top,color-mix(in_oklab,var(--color-indigo-500)_14%,transparent),transparent)]" aria-hidden />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {t("landing.hero.badge")}
              </span>
              <h1 className="mt-6 text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {t("landing.hero.title")}
              </h1>
              <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">{t("landing.hero.subtitle")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-11 px-5 text-base">
                  <Link href={appHref}>
                    {user ? appLabel : t("landing.hero.cta")}
                    <ArrowRightIcon />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-11 px-5 text-base">
                  <a href="#features">{t("landing.hero.secondary")}</a>
                </Button>
              </div>
            </div>
            <DashboardPreview label={t("landing.hero.preview")} />
          </div>

          {/* Facts about the system (real numbers, not marketing claims) */}
          <div className="border-y bg-muted/30">
            <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="py-8 text-center">
                  <dd className="text-4xl font-semibold tracking-tight tabular-nums text-primary">{s.value}</dd>
                  <dt className="mt-1 text-sm text-muted-foreground">{t(s.label)}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow={t("landing.features.eyebrow")} title={t("landing.features.title")} subtitle={t("landing.features.subtitle")} />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <article key={f.key} className="rounded-2xl border bg-card p-6 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className={`flex size-11 items-center justify-center rounded-xl ${f.tone}`}>
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{t(`landing.features.${f.key}.title`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`landing.features.${f.key}.text`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Portals */}
        <section id="portals" className="scroll-mt-20 border-y bg-muted/30 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow={t("landing.portals.eyebrow")} title={t("landing.portals.title")} subtitle={t("landing.portals.subtitle")} />
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {PORTALS.map((p) => (
                <article key={p.key} className="rounded-2xl border bg-card p-6 shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <p.icon className="size-5" />
                    </span>
                    <h3 className="text-lg font-semibold">{t(`landing.portals.${p.key}.title`)}</h3>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm">
                    {ITEMS.map((item) => (
                      <li key={item} className="flex gap-3">
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{t(`landing.portals.${p.key}.${item}`)}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow={t("landing.workflow.eyebrow")} title={t("landing.workflow.title")} subtitle={t("landing.workflow.subtitle")} />
            <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step} className="relative rounded-2xl border bg-card p-6 shadow-xs">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 flex items-center gap-2 text-lg font-semibold">
                    {t(`landing.workflow.${step}.title`)}
                    {i === STEPS.length - 1 && <ClipboardCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`landing.workflow.${step}.text`)}</p>
                  {i < STEPS.length - 1 && (
                    <ArrowRightIcon className="absolute top-8 -right-4 z-10 hidden size-5 text-muted-foreground/50 lg:block" aria-hidden />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="scroll-mt-20 border-y bg-muted/30 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow={t("landing.security.eyebrow")} title={t("landing.security.title")} subtitle={t("landing.security.subtitle")} />
            <div className="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {SECURITY.map((s) => (
                <div key={s.key} className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card text-primary shadow-xs">
                    <s.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{t(`landing.security.${s.key}.title`)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(`landing.security.${s.key}.text`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-14 text-center text-white sm:px-12">
              <div className="absolute -top-24 -right-16 size-80 rounded-full bg-white/10 blur-3xl" aria-hidden />
              <div className="absolute -bottom-28 -left-16 size-80 rounded-full bg-violet-400/20 blur-3xl" aria-hidden />
              <h2 className="relative text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t("landing.cta.title")}</h2>
              <p className="relative mx-auto mt-4 max-w-xl text-lg text-indigo-100">{t("landing.cta.subtitle")}</p>
              <Button asChild size="lg" variant="secondary" className="relative mt-8 h-11 bg-white px-6 text-base text-indigo-700 hover:bg-indigo-50">
                <Link href={appHref}>
                  {user ? appLabel : t("landing.cta.button")}
                  <ArrowRightIcon />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCapIcon className="size-4" />
            </span>
            <span>
              <span className="font-medium text-foreground">{t("app.name")}</span> — {t("landing.footer.tagline")}
            </span>
          </div>
          <p>
            © {new Date().getFullYear()} {t("app.name")}. {t("landing.footer.rights")}
          </p>
        </div>
      </footer>
    </div>
  );
}
