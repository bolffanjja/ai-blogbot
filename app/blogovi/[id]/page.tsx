"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BlogEditor, { type SaveState } from "@/components/BlogEditor";
import ConfirmDialog from "@/components/ConfirmDialog";
import GuardedLink from "@/components/GuardedLink";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import {
  STATUS_LABELS,
  StorageError,
  blogRepository,
  storageErrorMessage,
  type Blog,
  type BlogStatus,
} from "@/lib/blogs";
import { LANGUAGES, LENGTHS, TONES } from "@/lib/options";
import { formatDateTime } from "@/lib/text";
import { useUnsavedChangesWarning } from "@/lib/unsavedChanges";

type LoadState = "loading" | "ready" | "not-found" | "error";

export default function BlogPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  /** Poslednja sačuvana verzija bloga */
  const [blog, setBlog] = useState<Blog | null>(null);
  // Polja koja korisnik menja (čuvaju se tek klikom na "Sačuvaj")
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<BlogStatus>("draft");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Učitavanje bloga (samo u browseru)
  useEffect(() => {
    let active = true;
    blogRepository.get(id).then(
      (found) => {
        if (!active) return;
        if (!found) {
          setLoadState("not-found");
          return;
        }
        setBlog(found);
        setTitle(found.title);
        setContent(found.content);
        setStatus(found.status);
        setLoadState("ready");
      },
      (err: unknown) => {
        if (!active) return;
        setLoadError(storageErrorMessage(err));
        setLoadState("error");
      },
    );
    return () => {
      active = false;
    };
  }, [id]);

  const isDirty =
    blog !== null && (content !== blog.content || title.trim() !== blog.title || status !== blog.status);
  const saveState: SaveState = isSaving ? "saving" : saveError ? "error" : isDirty ? "unsaved" : "saved";

  useUnsavedChangesWarning(isDirty);

  async function handleSave() {
    if (!blog || isSaving) return;
    if (!title.trim()) {
      setSaveError("Naslov ne može biti prazan.");
      return;
    }
    setIsSaving(true);
    const changes = { title, content, status };
    try {
      let updated: Blog;
      try {
        updated = await blogRepository.update(blog.id, changes, { expectedUpdatedAt: blog.updatedAt });
      } catch (err) {
        if (err instanceof StorageError && err.code === "CONFLICT") {
          const overwrite = window.confirm(
            "Ovaj blog je u međuvremenu izmenjen u drugom tabu. Da li želiš da ga zameniš onim što je u ovom editoru?",
          );
          if (!overwrite) return;
          updated = await blogRepository.update(blog.id, changes);
        } else if (err instanceof StorageError && err.code === "NOT_FOUND") {
          if (!window.confirm("Ovaj blog je u međuvremenu obrisan. Da li želiš da ga sačuvaš kao novi blog?")) return;
          const created = await blogRepository.create({ ...blog, ...changes });
          setBlog(created);
          setSaveError(null);
          router.replace(`/blogovi/${created.id}`);
          return;
        } else {
          throw err;
        }
      }
      setBlog(updated);
      setTitle(updated.title);
      setSaveError(null);
    } catch (err) {
      setSaveError(storageErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!blog) return;
    setConfirmDelete(false);
    try {
      await blogRepository.remove(blog.id);
      // Nema više izmena koje treba čuvati; dok se prelazi na listu, prikazujemo učitavanje
      setLoadState("loading");
      setBlog(null);
      router.push("/blogovi");
    } catch (err) {
      setSaveError(storageErrorMessage(err));
    }
  }

  if (loadState === "loading") {
    return (
      <div className="animate-pulse space-y-4 p-6 lg:p-10">
        <div className="h-8 w-1/2 rounded-lg bg-slate-200" />
        <div className="h-96 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (loadState !== "ready" || !blog) {
    return (
      <div className="p-6 lg:p-10">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="font-medium text-slate-800">
            {loadState === "error" ? "Blog nije mogao da se učita" : "Blog nije pronađen"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {loadState === "error" ? loadError : "Možda je obrisan ili je link neispravan."}
          </p>
          <GuardedLink
            href="/blogovi"
            className="mt-5 inline-block rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Nazad na Moje blogove
          </GuardedLink>
        </div>
      </div>
    );
  }

  const language = LANGUAGES.find((l) => l.value === blog.language)?.label;
  const tone = TONES.find((t) => t.value === blog.tone)?.label;
  const length = LENGTHS.find((l) => l.value === blog.length)?.label;

  return (
    <>
      <PageHeader title={blog.title} subtitle={`Poslednja izmena: ${formatDateTime(blog.updatedAt)}`}>
        <div className="flex gap-2">
          <GuardedLink
            href="/blogovi"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Moji blogovi
          </GuardedLink>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Obriši
          </button>
        </div>
      </PageHeader>

      <div className="grid gap-6 p-6 lg:p-10 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-6">
          {blog.unfinished && (
            <p className="rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-800 ring-1 ring-orange-200">
              ⚠️ Generisanje ovog bloga je prekinuto, pa tekst verovatno nije potpun. Dopiši ga ručno ili generiši
              novi blog. Oznaka „Nedovršen“ nestaje kada blog sačuvaš kao „Završen“.
            </p>
          )}
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-700">
                Naziv bloga
              </label>
              <input
                id="title"
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
              <p className="mt-1 text-xs text-slate-500">Naziv u listi. Naslov u samom tekstu (# ...) menjaš u editoru.</p>
            </div>

            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium text-slate-700">Status</legend>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                {(["draft", "done"] as BlogStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    aria-pressed={status === s}
                    className={`rounded-lg px-2 py-2 text-sm font-medium transition ${
                      status === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </fieldset>

            {saveError && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">
                ⚠️ {saveError}
              </p>
            )}

            <p className="text-xs text-slate-500">
              Izmene naziva, statusa i teksta čuvaju se dugmetom „Sačuvaj“ u editoru ili prečicom Ctrl+S.
            </p>
          </div>

          <dl className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
            <Row label="Status">
              <StatusBadge status={blog.status} unfinished={blog.unfinished} />
            </Row>
            <Row label="Tema">{blog.topic || "—"}</Row>
            <Row label="Jezik">{language}</Row>
            <Row label="Ton">{tone}</Row>
            <Row label="Dužina">{length}</Row>
            <Row label="Napisao">{blog.source === "ai" ? "AI model" : "Demo šablon"}</Row>
            <Row label="Kreiran">{formatDateTime(blog.createdAt)}</Row>
            <Row label="Izmenjen">{formatDateTime(blog.updatedAt)}</Row>
          </dl>
        </aside>

        <BlogEditor
          content={content}
          onChange={setContent}
          isGenerating={false}
          isTyping={false}
          onSave={handleSave}
          saveState={saveState}
          downloadName={title || blog.title}
          initialMode="edit"
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Obrisati blog?"
        message={`Blog „${blog.title}“ biće trajno obrisan. Ovo ne može da se poništi.`}
        confirmLabel="Obriši"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{children}</dd>
    </div>
  );
}
