import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowUpIcon,
  BarChart3Icon,
  BuildingIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardCheckIcon,
  CodeIcon,
  EyeIcon,
  GraduationCapIcon,
  KeyRoundIcon,
  LanguagesIcon,
  LockIcon,
  LogInIcon,
  PresentationIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserPlusIcon,
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
  description:
    "Students, teachers, classes, attendance and grades in one secure system with role-based access.",
};

type Feature = {
  icon: LucideIcon;
  key:
    | "users"
    | "academics"
    | "timetable"
    | "attendance"
    | "grades"
    | "reports";
  tone: string;
};

const FEATURES: Feature[] = [
  {
    icon: UsersIcon,
    key: "users",
    tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  {
    icon: BuildingIcon,
    key: "academics",
    tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    icon: CalendarDaysIcon,
    key: "timetable",
    tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    icon: CalendarCheckIcon,
    key: "attendance",
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: GraduationCapIcon,
    key: "grades",
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    icon: BarChart3Icon,
    key: "reports",
    tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
];

const PORTALS = [
  { icon: ShieldCheckIcon, key: "admin" },
  { icon: PresentationIcon, key: "teacher" },
  { icon: GraduationCapIcon, key: "student" },
] as const;

const ABOUT_CARDS = [
  { key: "vision", image: "/images/vision.svg" },
  { key: "mission", image: "/images/mission.svg" },
] as const;

const VALUES = [
  { icon: EyeIcon, key: "transparency" },
  { icon: ShieldCheckIcon, key: "security" },
  { icon: SparklesIcon, key: "simplicity" },
  { icon: LanguagesIcon, key: "inclusion" },
] as const;

const SECURITY = [
  { icon: KeyRoundIcon, key: "permissions" },
  { icon: ScrollTextIcon, key: "audit" },
  { icon: LockIcon, key: "accounts" },
  { icon: CodeIcon, key: "api" },
] as const;

const FAQ = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

const CTA_STEPS = [
  { icon: UserPlusIcon, key: "step1" },
  { icon: LogInIcon, key: "step2" },
  { icon: KeyRoundIcon, key: "step3" },
] as const;

const FOOTER_EXPLORE: { href: string; label: TranslationKey }[] = [
  { href: "#about", label: "landing.nav.about" },
  { href: "#features", label: "landing.nav.features" },
  { href: "#portals", label: "landing.nav.portals" },
  { href: "#workflow", label: "landing.nav.workflow" },
  { href: "#security", label: "landing.nav.security" },
];

// Each portal link goes through the login page when the visitor isn't signed in.
const FOOTER_PORTALS: { href: string; label: TranslationKey; icon: LucideIcon }[] = [
  { href: "/admin", label: "portal.admin", icon: ShieldCheckIcon },
  { href: "/teacher", label: "portal.teacher", icon: PresentationIcon },
  { href: "/student", label: "portal.student", icon: GraduationCapIcon },
];

const STEPS = ["step1", "step2", "step3", "step4"] as const;
const ITEMS = ["item1", "item2", "item3", "item4"] as const;

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold tracking-wide text-primary uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-lg text-pretty text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}

/** A drawn (not screenshot) preview of the admin dashboard, so it always matches the theme. */
function DashboardPreview({ label }: { label: string }) {
  const stats = [
    {
      icon: GraduationCapIcon,
      value: "1,248",
      tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    },
    {
      icon: UsersIcon,
      value: "86",
      tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      icon: CalendarCheckIcon,
      value: "94%",
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ];
  const rows = [
    {
      code: "CS101-A",
      fill: "w-[92%]",
      status: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    },
    {
      code: "MATH101-A",
      fill: "w-[78%]",
      status: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    },
    {
      code: "CS102-B",
      fill: "w-[64%]",
      status: "bg-muted text-muted-foreground",
    },
  ];
  return (
    <div
      role="img"
      aria-label={label}
      className="relative mx-auto w-full max-w-2xl transition-transform duration-500 ease-out hover:[transform:perspective(1200px)_rotateY(-7deg)_rotateX(4deg)_scale(1.02)]"
    >
      <div
        className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-indigo-500/20 via-violet-500/10 to-sky-400/20 blur-2xl"
        aria-hidden
      />
      <div
        className="relative overflow-hidden rounded-2xl border border-white/20 bg-card text-card-foreground shadow-2xl shadow-indigo-950/40"
        aria-hidden
      >
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
              <div
                key={i}
                className={`h-1.5 rounded-full ${i === 0 ? "bg-primary/60" : "bg-muted-foreground/20"}`}
              />
            ))}
          </div>
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-3 gap-3">
              {stats.map((s, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div
                    className={`mb-2 flex size-7 items-center justify-center rounded-lg ${s.tone}`}
                  >
                    <s.icon className="size-4" />
                  </div>
                  <p className="text-lg font-semibold tabular-nums">
                    {s.value}
                  </p>
                  <div className="mt-1 h-1.5 w-12 rounded-full bg-muted" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border">
              {rows.map((r) => (
                <div
                  key={r.code}
                  className="flex items-center gap-3 border-b px-3 py-2.5 last:border-0"
                >
                  <span className="w-20 font-mono text-xs">{r.code}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full bg-primary ${r.fill}`}
                    />
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
    {
      value: Object.keys(PERMISSIONS).length,
      label: "landing.stats.permissions",
    },
    { value: locales.length, label: "landing.stats.languages" },
    { value: STEPS.length, label: "landing.stats.steps" },
  ];

  return (
    <div id="top" className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[96rem] items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12">
              <GraduationCapIcon className="size-5" />
            </span>
            <span className="text-base font-semibold">{t("app.name")}</span>
          </Link>
          <nav
            className="hidden flex-1 items-center gap-6 text-sm text-muted-foreground md:flex"
            aria-label="Sections"
          >
            <a
              href="#about"
              className="landing-link"
            >
              {t("landing.nav.about")}
            </a>
            <a
              href="#features"
              className="landing-link"
            >
              {t("landing.nav.features")}
            </a>
            <a
              href="#portals"
              className="landing-link"
            >
              {t("landing.nav.portals")}
            </a>
            <a
              href="#workflow"
              className="landing-link"
            >
              {t("landing.nav.workflow")}
            </a>
            <a
              href="#security"
              className="landing-link"
            >
              {t("landing.nav.security")}
            </a>
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
        <section>
          {/* Dark band with a dotted grid and soft lights. It keeps the same
              colours in light and dark theme, like the login page panel. */}
          <div className="relative isolate overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white">
            <div className="absolute inset-0 -z-10" aria-hidden>
              {/* dotted grid, fading out towards the edges */}
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgb(255_255_255/0.16)_1px,transparent_1.5px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,black,transparent)]" />
              {/* lights */}
              <div className="absolute -top-40 -left-32 size-[34rem] rounded-full bg-indigo-500/40 blur-3xl" />
              <div className="absolute -right-24 -bottom-48 size-[36rem] rounded-full bg-fuchsia-500/25 blur-3xl" />
              <div className="absolute top-1/3 left-1/2 size-72 -translate-x-1/2 rounded-full bg-sky-400/15 blur-3xl" />
              {/* thin highlight where the band meets the next section */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
          <div className="mx-auto grid max-w-[96rem] items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              {/* <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {t("landing.hero.badge")}
              </span> */}
              <h1 className="mt-6 text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {t("landing.hero.title")}
              </h1>
              <p className="mt-6 max-w-xl text-lg text-pretty text-indigo-100/90">
                {t("landing.hero.subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-11 bg-white px-5 text-base text-indigo-700 shadow-lg shadow-indigo-950/30 hover:bg-indigo-50"
                >
                  <Link href={appHref}>
                    {user ? appLabel : t("landing.hero.cta")}
                    <ArrowRightIcon className="transition-transform duration-200 group-hover/button:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-11 border-white/30 bg-white/5 px-5 text-base text-white backdrop-blur hover:bg-white/15 hover:text-white dark:border-white/30 dark:bg-white/5 dark:hover:bg-white/15"
                >
                  <a href="#features">{t("landing.hero.secondary")}</a>
                </Button>
              </div>
            </div>
            <DashboardPreview label={t("landing.hero.preview")} />
          </div>
          </div>

          {/* Facts about the system (real numbers, not marketing claims) */}
          <div className="border-b bg-muted/30">
            <dl className="mx-auto grid max-w-[96rem] grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="group cursor-default rounded-xl py-8 text-center transition-colors duration-300 hover:bg-primary/5">
                  <dd className="text-4xl font-semibold tracking-tight tabular-nums text-primary transition-transform duration-300 group-hover:scale-125">
                    {s.value}
                  </dd>
                  <dt className="mt-1 text-sm text-muted-foreground">
                    {t(s.label)}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* About: vision, mission and values */}
        <section id="about" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-[96rem] px-4 sm:px-6">
            <SectionHeading
              eyebrow={t("landing.about.eyebrow")}
              title={t("landing.about.title")}
              subtitle={t("landing.about.subtitle")}
            />

            {/* Vision and mission as alternating rows: image left / text right,
                then text left / image right. On phones the image is always on top.
                To use your own photos, replace public/images/vision.svg and
                mission.svg (or change the `image` paths in ABOUT_CARDS). */}
            <div className="mt-14 space-y-12 lg:space-y-20">
              {ABOUT_CARDS.map((card, i) => (
                <article
                  key={card.key}
                  className="group grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
                >
                  <div
                    className={`relative aspect-[16/9] overflow-hidden rounded-3xl border bg-muted shadow-lg transition duration-500 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-primary/20 ${
                      i % 2 === 1 ? "lg:order-2" : ""
                    }`}
                  >
                    <Image
                      src={card.image}
                      alt={t(`landing.about.${card.key}.imageAlt`)}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                      {t(`landing.about.${card.key}.label`)}
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
                      {t(`landing.about.${card.key}.title`)}
                    </h3>
                    <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
                      {t(`landing.about.${card.key}.text`)}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            {/* Core values */}
            <h3 className="mt-20 text-center text-xl font-semibold">
              {t("landing.about.values.title")}
            </h3>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map((v) => (
                <div
                  key={v.key}
                  className="group hover-lift rounded-2xl border bg-card p-6 text-center shadow-xs"
                >
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                    <v.icon className="size-6" />
                  </span>
                  <h4 className="mt-4 font-semibold">
                    {t(`landing.about.values.${v.key}.title`)}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`landing.about.values.${v.key}.text`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="scroll-mt-20 border-y bg-muted/30 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-[96rem] px-4 sm:px-6">
            <SectionHeading
              eyebrow={t("landing.features.eyebrow")}
              title={t("landing.features.title")}
              subtitle={t("landing.features.subtitle")}
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <article
                  key={f.key}
                  className="group hover-lift rounded-2xl border bg-card p-6 shadow-xs"
                >
                  <div
                    className={`flex size-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${f.tone}`}
                  >
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">
                    {t(`landing.features.${f.key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`landing.features.${f.key}.text`)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Portals */}
        <section
          id="portals"
          className="scroll-mt-20 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-[96rem] px-4 sm:px-6">
            <SectionHeading
              eyebrow={t("landing.portals.eyebrow")}
              title={t("landing.portals.title")}
              subtitle={t("landing.portals.subtitle")}
            />
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {PORTALS.map((p) => (
                <article
                  key={p.key}
                  className="group hover-lift rounded-2xl border bg-card p-6 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                      <p.icon className="size-5" />
                    </span>
                    <h3 className="text-lg font-semibold">
                      {t(`landing.portals.${p.key}.title`)}
                    </h3>
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
        <section id="workflow" className="scroll-mt-20 border-y bg-muted/30 py-20 sm:py-24">
          <div className="mx-auto max-w-[96rem] px-4 sm:px-6">
            <SectionHeading
              eyebrow={t("landing.workflow.eyebrow")}
              title={t("landing.workflow.title")}
              subtitle={t("landing.workflow.subtitle")}
            />
            <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li
                  key={step}
                  className="group hover-lift relative rounded-2xl border bg-card p-6 shadow-xs"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground ring-0 ring-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:ring-8">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 flex items-center gap-2 text-lg font-semibold">
                    {t(`landing.workflow.${step}.title`)}
                    {i === STEPS.length - 1 && (
                      <ClipboardCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`landing.workflow.${step}.text`)}
                  </p>
                  {i < STEPS.length - 1 && (
                    <ArrowRightIcon
                      className="absolute top-8 -right-4 z-10 hidden size-5 text-muted-foreground/50 lg:block"
                      aria-hidden
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Security */}
        <section
          id="security"
          className="scroll-mt-20 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-[96rem] px-4 sm:px-6">
            <SectionHeading
              eyebrow={t("landing.security.eyebrow")}
              title={t("landing.security.title")}
              subtitle={t("landing.security.subtitle")}
            />
            <div className="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {SECURITY.map((s) => (
                <div key={s.key} className="group -m-3 flex gap-4 rounded-2xl p-3 transition-colors duration-300 hover:bg-muted/70">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card text-primary shadow-xs transition duration-300 group-hover:scale-110 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                    <s.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">
                      {t(`landing.security.${s.key}.title`)}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {t(`landing.security.${s.key}.text`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Frequently asked questions. <details> opens and closes without any JavaScript. */}
        <section
          id="faq"
          className="scroll-mt-20 border-y bg-muted/30 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-[96rem] px-4 sm:px-6">
            <SectionHeading
              eyebrow={t("landing.faq.eyebrow")}
              title={t("landing.faq.title")}
              subtitle={t("landing.faq.subtitle")}
            />
            <div className="mt-14 grid items-start gap-4 lg:grid-cols-2">
              {FAQ.map((key) => (
                <details
                  key={key}
                  className="group rounded-2xl border bg-card px-6 shadow-xs transition duration-300 open:border-primary/40 open:shadow-md hover:border-primary/40 hover:shadow-md"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium [&::-webkit-details-marker]:hidden">
                    {t(`landing.faq.${key}.q`)}
                    <ChevronDownIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pb-5 leading-relaxed text-muted-foreground">
                    {t(`landing.faq.${key}.a`)}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Get started: what to do, in three steps */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-[96rem] px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 text-white sm:p-12 lg:p-16">
              <div
                className="absolute -top-24 -right-16 size-80 rounded-full bg-white/10 blur-3xl"
                aria-hidden
              />
              <div
                className="absolute -bottom-28 -left-16 size-80 rounded-full bg-violet-400/20 blur-3xl"
                aria-hidden
              />
              <div className="relative grid items-center gap-12 lg:grid-cols-2">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                    {t("landing.cta.title")}
                  </h2>
                  <p className="mt-4 max-w-xl text-lg text-indigo-100">
                    {t("landing.cta.subtitle")}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button
                      asChild
                      size="lg"
                      variant="secondary"
                      className="h-11 bg-white px-6 text-base text-indigo-700 hover:bg-indigo-50"
                    >
                      <Link href={appHref}>
                        {user ? appLabel : t("landing.cta.button")}
                        <ArrowRightIcon className="transition-transform duration-200 group-hover/button:translate-x-1" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="ghost"
                      className="h-11 px-5 text-base text-white hover:bg-white/10 hover:text-white"
                    >
                      <a href="#faq">{t("landing.footer.faq")}</a>
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold tracking-wide text-indigo-200 uppercase">
                    {t("landing.cta.stepsTitle")}
                  </p>
                  <ol className="mt-5 space-y-3">
                    {CTA_STEPS.map((step, i) => (
                      <li
                        key={step.key}
                        className="group flex items-start gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur transition duration-300 hover:translate-x-2 hover:bg-white/20"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                          <step.icon className="size-5" />
                        </span>
                        <div>
                          <p className="font-semibold">
                            {i + 1}. {t(`landing.cta.${step.key}.title`)}
                          </p>
                          <p className="mt-0.5 text-sm text-indigo-100">
                            {t(`landing.cta.${step.key}.text`)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-[96rem] px-4 sm:px-6">
          <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div>
              <Link href="/" className="group flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12">
                  <GraduationCapIcon className="size-5" />
                </span>
                <span className="text-base font-semibold">{t("app.name")}</span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t("landing.footer.description")}
              </p>
              <div className="mt-5">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("landing.footer.preferences")}
                </p>
                <div className="mt-1 -ml-2 flex items-center gap-1">
                  <LanguageMenu />
                  <ThemeToggle />
                </div>
              </div>
            </div>

            {/* Explore */}
            <nav aria-label={t("landing.footer.explore")}>
              <h3 className="text-sm font-semibold">{t("landing.footer.explore")}</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {FOOTER_EXPLORE.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="inline-block transition duration-200 hover:translate-x-1 hover:text-foreground">
                      {t(link.label)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Portals */}
            <nav aria-label={t("landing.footer.portals")}>
              <h3 className="text-sm font-semibold">{t("landing.footer.portals")}</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {FOOTER_PORTALS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-flex items-center gap-2 transition duration-200 hover:translate-x-1 hover:text-foreground">
                      <link.icon className="size-4" />
                      {t(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Help */}
            <nav aria-label={t("landing.footer.help")}>
              <h3 className="text-sm font-semibold">{t("landing.footer.help")}</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>
                  <a href="#faq" className="inline-block transition duration-200 hover:translate-x-1 hover:text-foreground">
                    {t("landing.footer.faq")}
                  </a>
                </li>
                <li>
                  <Link href={appHref} className="inline-block transition duration-200 hover:translate-x-1 hover:text-foreground">
                    {appLabel}
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="inline-block transition duration-200 hover:translate-x-1 hover:text-foreground">
                    {t("landing.footer.account")}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t py-6 text-sm text-muted-foreground sm:flex-row">
            <p>
              © {new Date().getFullYear()} {t("app.name")}.{" "}
              {t("landing.footer.rights")}
            </p>
            <a href="#top" className="group inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
              {t("landing.footer.backToTop")}
              <ArrowUpIcon className="size-4 transition-transform duration-200 group-hover:-translate-y-1" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
