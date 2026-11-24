"use client";

import { useEffect, useRef, useState } from "react";
import MarkdownPreview from "./MarkdownPreview";
import { countWords, extractTitle, readingMinutes, slugify } from "@/lib/text";

/** Stanje čuvanja koje se prikazuje u editoru */
export type SaveState = "saved" | "unsaved" | "saving" | "error";

interface Props {
  content: string;
  onChange: (content: string) => void;
  isGenerating: boolean;
  isTyping: boolean;
  /** Poruka iznad "kostura" dok čekamo prve reči od modela */
  waitingText?: string;
  /** Napomena ispod teksta, npr. da je tekst prekinut */
  notice?: string | null;
  /** Ako je zadato, editor prikazuje dugme "Sačuvaj" i podržava Ctrl+S */
  onSave?: () => void;
  saveState?: SaveState;
  /** Naziv za preuzeti fajl (inače se uzima naslov iz teksta) */
  downloadName?: string;
  /** Da li editor počinje u pregledu ili u uređivanju */
  initialMode?: Mode;
}

type Mode = "preview" | "edit";

const SAVE_LABELS: Record<SaveState, { text: string; className: string }> = {
  saved: { text: "✓ Sačuvano", className: "text-emerald-600" },
  unsaved: { text: "● Nesačuvane izmene", className: "text-amber-600" },
  saving: { text: "Čuvam...", className: "text-slate-500" },
  error: { text: "⚠ Čuvanje nije uspelo", className: "text-red-600" },
};

/** Preuzimanje teksta kao .md fajla */
export function downloadMarkdown(content: string, name: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(name)}.md`;
  a.click();
  // Malo sačekamo pre oslobađanja, da neki browseri ne prekinu preuzimanje
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Kopiranje u clipboard. Vraća true SAMO ako je browser potvrdio da je tekst kopiran.
 * Ako moderni način nije dostupan ili ga browser odbije, probamo stariji način.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // probaćemo stariji način ispod
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export default function BlogEditor({
  content,
  onChange,
  isGenerating,
  isTyping,
  waitingText,
  notice,
  onSave,
  saveState,
  downloadName,
  initialMode = "preview",
}: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const words = countWords(content);
  const readMinutes = readingMinutes(words);
  const title = downloadName || extractTitle(content) || "blog";

  const busy = isGenerating || isTyping;

  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const handleCopy = async () => {
    const ok = await copyText(content);
    setCopyState(ok ? "copied" : "failed");
    if (copyTimer.current) clearTimeout(copyTimer.current);
    // Greška ostaje duže na ekranu, da korisnik stigne da je pročita
    copyTimer.current = setTimeout(() => setCopyState("idle"), ok ? 2500 : 6000);
  };

  const handleDownload = () => downloadMarkdown(content, title);

  // Ctrl+S (ili Cmd+S na Mac-u) čuva izmene
  useEffect(() => {
    if (!onSave) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!busy && saveState !== "saving") onSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSave, busy, saveState]);

  return (
    <section className="flex min-h-[640px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Traka sa alatima */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
        <div className="flex rounded-lg bg-slate-100 p-1">
          {(["preview", "edit"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              disabled={busy}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
                mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {m === "preview" ? "👁 Pregled" : "✏️ Uredi"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!content || busy}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Kopiraj
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!content || busy}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white transition hover:bg-slate-700 disabled:opacity-40"
          >
            Preuzmi .md
          </button>
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={!content || busy || saveState === "saving" || saveState === "saved"}
              title="Sačuvaj izmene (Ctrl+S)"
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-40"
            >
              Sačuvaj
            </button>
          )}
        </div>
      </div>

      {/* Rezultat kopiranja */}
      {copyState === "copied" && (
        <p role="status" className="border-b border-emerald-200 bg-emerald-50 px-5 py-2 text-sm text-emerald-800">
          ✓ Tekst je kopiran.
        </p>
      )}
      {copyState === "failed" && (
        <p role="alert" className="border-b border-red-200 bg-red-50 px-5 py-2 text-sm text-red-800">
          ⚠️ Kopiranje nije uspelo — browser nije dozvolio pristup clipboard-u. Prebaci se na „Uredi“, označi tekst
          (Ctrl+A) i kopiraj ga sa Ctrl+C.
        </p>
      )}

      {/* Sadržaj */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {isGenerating && !content ? (
          <div className="mx-auto max-w-2xl space-y-4">
            {waitingText && (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <span className="h-2 w-2 animate-ping rounded-full bg-brand-500" />
                {waitingText}
              </p>
            )}
            <div className="animate-pulse space-y-4">
            <div className="h-8 w-3/4 rounded-lg bg-slate-200" />
            <div className="h-4 rounded bg-slate-100" />
            <div className="h-4 w-11/12 rounded bg-slate-100" />
            <div className="h-4 w-4/5 rounded bg-slate-100" />
            <div className="mt-8 h-6 w-1/2 rounded-lg bg-slate-200" />
            <div className="h-4 rounded bg-slate-100" />
            <div className="h-4 w-5/6 rounded bg-slate-100" />
            </div>
          </div>
        ) : !content && (mode === "preview" || busy) ? (
          <div className="flex h-full flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-3xl">
              📝
            </div>
            <p className="font-medium text-slate-800">Još nema bloga</p>
            <p className="mt-1 max-w-xs text-sm text-slate-500">
              Unesi temu sa leve strane i klikni „Generiši blog“. Tekst će se pojaviti ovde.
            </p>
          </div>
        ) : mode === "edit" && !busy ? (
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            className="h-full min-h-[520px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-800 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        ) : (
          <MarkdownPreview content={content} />
        )}
      </div>

      {notice && (
        <div className="mx-5 mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          {notice}
        </div>
      )}

      {/* Statistika */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-2.5 text-xs text-slate-500">
        <span>
          {words} reči · {content.length} karaktera · ~{readMinutes} min čitanja
          {saveState && content && !busy && (
            <span className={`ml-2 font-medium ${SAVE_LABELS[saveState].className}`}>
              {SAVE_LABELS[saveState].text}
            </span>
          )}
        </span>
        {mode === "edit" && content && !busy && <span>Markdown: # naslov, ## podnaslov, - lista, **bold**</span>}
        {(isTyping || (isGenerating && content)) && <span className="text-brand-600">Piše se...</span>}
      </div>
    </section>
  );
}
