"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { IconDocuments } from "@/components/icons";
import { copyText, downloadMarkdown } from "@/components/BlogEditor";
import { blogRepository, storageErrorMessage, useBlogs, type Blog } from "@/lib/blogs";
import { DEFAULT_FILTERS, SORT_OPTIONS, filterBlogs, type BlogFilters } from "@/lib/blogs/filter";
import { LANGUAGES } from "@/lib/options";
import { formatDate } from "@/lib/text";

const selectClass =
  "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

export default function MyBlogsPage() {
  const { status, blogs, warning, error } = useBlogs();
  const [filters, setFilters] = useState<BlogFilters>(DEFAULT_FILTERS);
  const [toDelete, setToDelete] = useState<Blog | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const visible = filterBlogs(blogs, filters);
  const filtersActive =
    filters.query.trim() !== "" || filters.language !== "all" || filters.status !== "all";

  const set = <K extends keyof BlogFilters>(key: K, value: BlogFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  function flash(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage((m) => (m?.text === text ? null : m)), 3000);
  }

  async function handleCopy(blog: Blog) {
    if (await copyText(blog.content)) flash("ok", `Tekst bloga „${blog.title}“ je kopiran.`);
    else flash("error", "Kopiranje nije uspelo. Otvori blog i kopiraj tekst ručno.");
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const blog = toDelete;
    setToDelete(null);
    try {
      await blogRepository.remove(blog.id);
      flash("ok", `Blog „${blog.title}“ je obrisan.`);
    } catch (err) {
      flash("error", storageErrorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Moji blogovi"
        subtitle={
          status === "ready"
            ? `${blogs.length} ${blogs.length === 1 ? "sačuvan blog" : "sačuvanih blogova"} · čuvaju se samo u ovom browseru`
            : "Sačuvani blogovi"
        }
      >
        <Link
          href="/novi-blog"
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          + Novi blog
        </Link>
      </PageHeader>

      <div className="space-y-4 p-6 lg:p-10">
        {warning && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">⚠️ {warning}</p>
        )}
        {message && (
          <p
            role="status"
            className={`rounded-xl px-4 py-3 text-sm ring-1 ${
              message.type === "ok"
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                : "bg-red-50 text-red-800 ring-red-200"
            }`}
          >
            {message.text}
          </p>
        )}

        {status === "error" && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
            ⚠️ {error}
          </p>
        )}

        {status === "loading" && (
          <div className="animate-pulse space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-100" />
            ))}
          </div>
        )}

        {status === "ready" && blogs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white">
            <EmptyState
              icon={IconDocuments}
              title="Još nemaš sačuvanih blogova"
              description="Svaki blog koji generišeš automatski se čuva ovde kao nacrt."
              actionLabel="Kreiraj prvi blog"
              actionHref="/novi-blog"
            />
          </div>
        )}

        {status === "ready" && blogs.length > 0 && (
          <>
            {/* Pretraga i filteri */}
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
              <input
                type="search"
                value={filters.query}
                onChange={(e) => set("query", e.target.value)}
                placeholder="Pretraži po naslovu..."
                aria-label="Pretraga po naslovu"
                className={`${selectClass} sm:col-span-2 lg:col-span-1`}
              />
              <select
                aria-label="Jezik"
                value={filters.language}
                onChange={(e) => set("language", e.target.value as BlogFilters["language"])}
                className={selectClass}
              >
                <option value="all">Svi jezici</option>
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Status"
                value={filters.status}
                onChange={(e) => set("status", e.target.value as BlogFilters["status"])}
                className={selectClass}
              >
                <option value="all">Svi statusi</option>
                <option value="draft">Nacrti</option>
                <option value="done">Završeni</option>
              </select>
              <select
                aria-label="Sortiranje"
                value={filters.sort}
                onChange={(e) => set("sort", e.target.value as BlogFilters["sort"])}
                className={`${selectClass} sm:col-span-2 lg:col-span-1`}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {visible.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
                <p className="font-medium text-slate-800">Nijedan blog ne odgovara pretrazi</p>
                {filtersActive && (
                  <button
                    type="button"
                    onClick={() => setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort }))}
                    className="mt-3 text-sm font-medium text-brand-600 hover:underline"
                  >
                    Poništi filtere
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-3">
                {visible.map((blog) => (
                  <li
                    key={blog.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/blogovi/${blog.id}`}
                          className="block truncate font-semibold text-slate-900 hover:text-brand-700"
                        >
                          {blog.title}
                        </Link>
                        {blog.topic && blog.topic !== blog.title && (
                          <p className="mt-0.5 truncate text-sm text-slate-500">Tema: {blog.topic}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <StatusBadge status={blog.status} unfinished={blog.unfinished} />
                          <span>{LANGUAGES.find((l) => l.value === blog.language)?.label}</span>
                          <span>·</span>
                          <span>{blog.wordCount} reči</span>
                          <span>·</span>
                          <span>Izmenjen {formatDate(blog.updatedAt)}</span>
                          {blog.source === "demo" && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">demo</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/blogovi/${blog.id}`}
                          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                        >
                          Otvori
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopy(blog)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                        >
                          Kopiraj
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadMarkdown(blog.content, blog.title)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                        >
                          .md
                        </button>
                        <button
                          type="button"
                          onClick={() => setToDelete(blog)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          Obriši
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Obrisati blog?"
        message={`Blog „${toDelete?.title ?? ""}“ biće trajno obrisan. Ovo ne može da se poništi.`}
        confirmLabel="Obriši"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
