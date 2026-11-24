"use client";

// Dashboard — početna stranica.
// Svi brojevi dolaze iz stvarno sačuvanih blogova (useBlogs → localStorage).
// useBlogs sam osvežava podatke kada se blog doda, izmeni ili obriše (i u drugom tabu).
// Stranica ne šalje nikakve zahteve AI modelu, pa radi i kada Ollama nije pokrenuta.

import { useMemo } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import DashboardStatCard from "@/components/DashboardStatCard";
import RecentBlogItem from "@/components/RecentBlogItem";
import EmptyState from "@/components/EmptyState";
import { IconArrowRight, IconCalendar, IconDocuments, IconPen, IconPlus, IconText } from "@/components/icons";
import { useBlogs } from "@/lib/blogs";
import { computeStats, latestDraft, recentlyUpdated } from "@/lib/blogs/stats";
import { formatDate } from "@/lib/text";

export default function DashboardPage() {
  const { status, blogs, warning, error } = useBlogs();
  const loading = status === "loading";
  const failed = status === "error";

  // Računamo samo kada se lista blogova promeni
  const stats = useMemo(() => computeStats(blogs), [blogs]);
  const recent = useMemo(() => recentlyUpdated(blogs, 5), [blogs]);
  const draft = useMemo(() => latestDraft(blogs), [blogs]);

  const value = (n: number) => (failed ? null : n);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Dobrodošla u AI BlogBot"
        description="Organizuj svoje blogove i kreiraj novi sadržaj uz pomoć veštačke inteligencije koja radi na tvom računaru."
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden="true" />
          Local AI
        </span>
      </PageHeader>

      <div className="space-y-6 p-6 lg:p-10">
        {failed && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
            Blogovi nisu mogli da se učitaju: {error}
          </p>
        )}
        {warning && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">{warning}</p>
        )}

        {/* B. Statistika */}
        <section aria-label="Statistika" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            label="Ukupno blogova"
            value={value(stats.total)}
            hint="Svi sačuvani blogovi"
            icon={IconDocuments}
            loading={loading}
          />
          <DashboardStatCard
            label="Ove nedelje"
            value={value(stats.thisWeek)}
            hint="Kreirani od ponedeljka"
            icon={IconCalendar}
            loading={loading}
          />
          <DashboardStatCard
            label="Nacrti"
            value={value(stats.drafts)}
            hint="Blogovi sa statusom Nacrt"
            icon={IconPen}
            loading={loading}
          />
          <DashboardStatCard
            label="Ukupno reči"
            value={value(stats.totalWords)}
            hint="Zbir reči u svim blogovima"
            icon={IconText}
            loading={loading}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* C. Glavna kartica za kreiranje */}
          <section className="flex flex-col justify-between gap-6 rounded-2xl bg-brand-700 p-6 text-white shadow-sm sm:flex-row sm:items-center lg:col-span-2 lg:p-8">
            <div>
              <h2 className="text-xl font-semibold">Šta ćemo danas pisati?</h2>
              <p className="mt-1 max-w-md text-sm text-brand-100">
                Pretvori svoju ideju u blog uz pomoć veštačke inteligencije.
              </p>
            </div>
            <Link
              href="/novi-blog"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700"
            >
              <IconPlus className="h-4 w-4" />
              Kreiraj novi blog
            </Link>
          </section>

          {/* E. Nastavi poslednji nacrt */}
          <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Nastavi poslednji nacrt</h2>
            {loading ? (
              <div className="mt-3 space-y-2">
                <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
              </div>
            ) : draft ? (
              <>
                <p className="mt-3 truncate font-medium text-slate-800" title={draft.title}>
                  {draft.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Poslednja izmena {formatDate(draft.updatedAt)}
                  {draft.unfinished && " · nedovršen"}
                </p>
                <Link
                  href={`/blogovi/${draft.id}`}
                  className="mt-auto inline-flex items-center gap-1.5 self-start pt-4 text-sm font-semibold text-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:underline"
                >
                  Nastavi pisanje
                  <IconArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                {blogs.length === 0
                  ? "Kada sačuvaš prvi blog, ovde ćeš moći brzo da nastaviš rad na njemu."
                  : "Nema otvorenih nacrta — svi blogovi su označeni kao završeni."}
              </p>
            )}
          </section>
        </div>

        {/* D. Poslednji blogovi */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Poslednji blogovi</h2>
            {blogs.length > 0 && (
              <Link
                href="/blogovi"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:underline"
              >
                Prikaži sve
                <IconArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : failed ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">Lista blogova trenutno ne može da se prikaže.</p>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={IconDocuments}
              title="Još nemaš sačuvanih blogova"
              description="Svaki blog koji generišeš automatski se čuva kao nacrt i pojavljuje se ovde."
              actionLabel="Kreiraj prvi blog"
              actionHref="/novi-blog"
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((blog) => (
                <RecentBlogItem key={blog.id} blog={blog} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
