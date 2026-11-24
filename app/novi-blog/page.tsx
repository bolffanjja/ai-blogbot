"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GeneratorForm from "@/components/GeneratorForm";
import BlogEditor, { type SaveState } from "@/components/BlogEditor";
import OllamaStatus from "@/components/OllamaStatus";
import ErrorAlert from "@/components/ErrorAlert";
import PageHeader from "@/components/PageHeader";
import GuardedLink from "@/components/GuardedLink";
import ConfirmDialog from "@/components/ConfirmDialog";
import { generateBlog } from "@/lib/demoGenerator";
import { GenerationError, generateWithOllama, type ErrorCode } from "@/lib/aiClient";
import type { GenerationEnd } from "@/lib/ollama";
import { LANGUAGES, TARGET_WORDS, type BlogOptions, type Mode } from "@/lib/options";
import { joinContinuation, prepareForContinuation } from "@/lib/continuation";
import GenerationStatus, { MAX_CONTINUATIONS, type GenerationInfo } from "@/components/GenerationStatus";
import { STATUS_LABELS, StorageError, blogRepository, storageErrorMessage, useBlogs } from "@/lib/blogs";
import { countWords, extractTitle, formatDate } from "@/lib/text";
import { requestNavigation, useNavigationBlocker, useUnsavedChangesWarning } from "@/lib/unsavedChanges";
import { languageWarning } from "@/lib/language";

/** Poslednja sačuvana verzija teksta koji je trenutno u editoru */
interface SavedVersion {
  id: string;
  content: string;
  updatedAt: string;
}

export default function GeneratorPage() {
  const [options, setOptions] = useState<BlogOptions>({
    topic: "",
    language: "sr",
    tone: "professional",
    length: "medium",
  });
  const [mode, setMode] = useState<Mode>("ai");
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<{ code: ErrorCode; message: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // Cilj, stvaran broj reči i kako se generisanje završilo (samo AI režim)
  const [genInfo, setGenInfo] = useState<GenerationInfo | null>(null);

  // Čuvanje u "Moji blogovi"
  const [saved, setSaved] = useState<SavedVersion | null>(null);
  // Sa kojim podešavanjima je napisan tekst koji je sada u editoru
  // (unfinished = generisanje je prekinuto ili odsečeno, tekst nije potpun)
  const [textMeta, setTextMeta] = useState<{ options: BlogOptions; source: Mode; unfinished?: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Prozor "Imaš nesačuvane izmene" pre generisanja novog bloga
  const [confirmReplace, setConfirmReplace] = useState(false);
  // Prozor "Ostani / Prekini i napusti": adresa na koju korisnik želi da ode tokom generisanja
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);
  // Kada je korisnik izabrao "Prekini i napusti": kuda idemo kad se tekst sačuva
  const leaveAfterStopRef = useRef<string | null>(null);
  const router = useRouter();

  const { blogs } = useBlogs();

  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const busy = isGenerating || isTyping;
  // Tekst se razlikuje od sačuvane verzije (ili još nije sačuvan)
  const isDirty = !busy && content.trim() !== "" && content !== (saved?.content ?? "");
  const saveState: SaveState | undefined = isSaving
    ? "saving"
    : saveError
      ? "error"
      : isDirty
        ? "unsaved"
        : saved
          ? "saved"
          : undefined;

  useUnsavedChangesWarning(isDirty);

  // Dok AI generisanje traje, linkovi u aplikaciji ne vode odmah na drugu stranicu,
  // već otvaraju prozor "Ostani / Prekini i napusti". Zatvaranje taba traži potvrdu browsera.
  const aiGenerating = isGenerating && mode === "ai";
  useNavigationBlocker(aiGenerating ? setLeaveTarget : null);

  // Pri zatvaranju stranice zaustavi sve što radi
  useEffect(
    () => () => {
      if (typingTimer.current) clearInterval(typingTimer.current);
      abortRef.current?.abort();
    },
    [],
  );

  // Tajmer koji pokazuje koliko dugo AI piše
  useEffect(() => {
    if (!isGenerating) return;
    setElapsedSeconds(0);
    const started = Date.now();
    const id = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, [isGenerating]);

  function stopTyping() {
    if (typingTimer.current) clearInterval(typingTimer.current);
    typingTimer.current = null;
    setIsTyping(false);
  }

  // Efekat "kucanja" za demo režim - tekst se pojavljuje postepeno
  function typeOut(fullText: string) {
    const tokens = fullText.split(/(\s+)/);
    let index = 0;
    setIsTyping(true);
    typingTimer.current = setInterval(() => {
      index += 6;
      setContent(tokens.slice(0, index).join(""));
      if (index >= tokens.length) {
        setContent(fullText);
        stopTyping();
      }
    }, 30);
  }

  /** Čuva novi blog kao nacrt. Vraća true ako je uspelo. */
  async function saveAsNewBlog(
    text: string,
    usedOptions: BlogOptions,
    source: Mode,
    unfinished = false,
  ): Promise<boolean> {
    setIsSaving(true);
    try {
      const blog = await blogRepository.create({
        title: extractTitle(text) ?? usedOptions.topic,
        topic: usedOptions.topic,
        content: text,
        language: usedOptions.language,
        tone: usedOptions.tone,
        length: usedOptions.length,
        status: "draft",
        unfinished,
        source,
      });
      setSaved({ id: blog.id, content: blog.content, updatedAt: blog.updatedAt });
      setSaveError(null);
      return true;
    } catch (err) {
      setSaveError(storageErrorMessage(err));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  /** Dugme "Sačuvaj" (ili Ctrl+S): čuva izmene u postojeći blog ili pravi novi. */
  async function handleSave() {
    if (!content.trim() || busy || isSaving) return;
    const text = content;

    if (!saved) {
      const meta = textMeta ?? { options, source: mode };
      await saveAsNewBlog(text, meta.options, meta.source, meta.unfinished);
      return;
    }

    setIsSaving(true);
    try {
      let blog;
      try {
        blog = await blogRepository.update(saved.id, { content: text }, { expectedUpdatedAt: saved.updatedAt });
      } catch (err) {
        if (err instanceof StorageError && err.code === "CONFLICT") {
          const overwrite = window.confirm(
            "Ovaj blog je u međuvremenu izmenjen u drugom tabu. Da li želiš da ga zameniš tekstom iz ovog editora?",
          );
          if (!overwrite) return;
          blog = await blogRepository.update(saved.id, { content: text });
        } else if (err instanceof StorageError && err.code === "NOT_FOUND") {
          if (window.confirm("Ovaj blog je u međuvremenu obrisan. Da li želiš da ga sačuvaš kao novi blog?")) {
            setIsSaving(false);
            const meta = textMeta ?? { options, source: mode };
            await saveAsNewBlog(text, meta.options, meta.source, meta.unfinished);
          }
          return;
        } else {
          throw err;
        }
      }
      setSaved({ id: blog.id, content: blog.content, updatedAt: blog.updatedAt });
      setSaveError(null);
    } catch (err) {
      setSaveError(storageErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  /** Klik na "Generiši blog": ako ima nesačuvanih izmena, prvo pitamo. */
  function requestGenerate() {
    if (isDirty) {
      setConfirmReplace(true);
      return;
    }
    void handleGenerate();
  }

  /** Posle svakog AI zahteva: oslobodi dugme i, ako je korisnik izabrao "Prekini i napusti", idi dalje. */
  function finishRun(controller: AbortController) {
    if (abortRef.current === controller) abortRef.current = null;
    setIsGenerating(false);
    const target = leaveAfterStopRef.current;
    if (target) {
      leaveAfterStopRef.current = null;
      router.push(target);
    }
  }

  /** Upisuje podatke iz Ollame (broj tokena, trajanje) u status generisanja. */
  function infoFromEnd(end: GenerationEnd) {
    return { outputTokens: end.outputTokens, writeMs: end.writeMs, numPredict: end.numPredict };
  }

  /** Čuva tekst iz generatora: menja već sačuvan blog ili pravi novi. */
  async function persistGenerated(
    text: string,
    meta: { options: BlogOptions; source: Mode },
    unfinished: boolean,
    current: SavedVersion | null,
  ): Promise<boolean> {
    if (!current) return saveAsNewBlog(text, meta.options, meta.source, unfinished);
    setIsSaving(true);
    try {
      const blog = await blogRepository.update(current.id, { content: text, unfinished });
      setSaved({ id: blog.id, content: blog.content, updatedAt: blog.updatedAt });
      setSaveError(null);
      return true;
    } catch (err) {
      if (err instanceof StorageError && err.code === "NOT_FOUND") {
        setIsSaving(false);
        return saveAsNewBlog(text, meta.options, meta.source, unfinished);
      }
      setSaveError(storageErrorMessage(err));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerate() {
    setConfirmReplace(false);

    // Pamtimo šta je bilo u editoru, da bismo to vratili ako generisanje ne uspe pre prve reči
    const previous = { content, saved, textMeta, saveError };
    const restorePrevious = () => {
      setContent(previous.content);
      setSaved(previous.saved);
      setTextMeta(previous.textMeta);
      setSaveError(previous.saveError);
      if (previous.content.trim()) {
        setNotice("Novi blog nije napravljen, pa je vraćen tekst koji je ranije bio u editoru.");
      }
    };

    stopTyping();
    abortRef.current?.abort();
    setContent("");
    setError(null);
    setNotice(null);
    setSaved(null);
    setSaveError(null);
    setIsGenerating(true);

    const usedOptions = options;
    const usedMode = mode;
    setTextMeta({ options: usedOptions, source: usedMode });

    // DEMO režim: šabloni, bez AI-ja (bez statusa dužine — šabloni ne prate cilj)
    if (usedMode === "demo") {
      setGenInfo(null);
      try {
        const blog = await generateBlog(usedOptions);
        await saveAsNewBlog(blog, usedOptions, "demo");
        typeOut(blog);
      } catch {
        restorePrevious();
        setError({ code: "UNKNOWN", message: "Demo generisanje nije uspelo. Pokušaj ponovo." });
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // AI režim: lokalni model preko Ollame
    const controller = new AbortController();
    abortRef.current = controller;
    let partial = "";
    const target = TARGET_WORDS[usedOptions.length];
    setGenInfo({ target, status: "running", continuations: 0 });
    try {
      const result = await generateWithOllama(
        usedOptions,
        (text) => {
          partial = text;
          setContent(text);
        },
        controller.signal,
      );
      // "length" = model je udario u granicu tokena pre kraja → tekst nije završen
      // "repetition" = model je počeo da ponavlja isti tekst, server ga je zaustavio
      const unfinished = result.finishReason !== "stop";
      setTextMeta({ options: usedOptions, source: "ai", unfinished });
      await saveAsNewBlog(result.text, usedOptions, "ai", unfinished);
      setGenInfo({
        target,
        status: result.finishReason === "stop" ? "complete" : result.finishReason,
        continuations: 0,
        ...infoFromEnd(result.end),
      });
      const notices = [
        result.finishReason === "length"
          ? "Model je stigao do granice dužine pre kraja teksta. Blog je sačuvan kao nedovršen nacrt — klikni „Nastavi generisanje“ ili dopiši kraj ručno."
          : null,
        result.finishReason === "repetition"
          ? "Model je počeo da piše isti tekst u krug, pa je automatski zaustavljen. Ponovljeni deo je uklonjen, a blog je sačuvan kao nedovršen nacrt. Najbolje je da ga generišeš ponovo."
          : null,
        // Da li je model zaista pisao na izabranom jeziku
        languageWarning(result.text, usedOptions.language),
      ].filter(Boolean);
      if (notices.length) setNotice(notices.join(" "));
    } catch (err) {
      const partialText = (err instanceof GenerationError && err.partial ? err.partial : partial).trim();
      if (controller.signal.aborted) {
        setGenInfo({ target, status: "aborted", continuations: 0 });
        if (partialText) {
          setContent(partialText);
          setTextMeta({ options: usedOptions, source: "ai", unfinished: true });
          const ok = await saveAsNewBlog(partialText, usedOptions, "ai", true);
          setNotice(
            ok
              ? "Generisanje je prekinuto. Tekst napisan do tog trenutka je sačuvan kao nedovršen nacrt."
              : "Generisanje je prekinuto. Tekst napisan do tog trenutka je u editoru, ali nije sačuvan.",
          );
          // Ako čuvanje nije uspelo, ne napuštamo stranicu — tekst bi se izgubio
          if (!ok) leaveAfterStopRef.current = null;
        } else {
          // Prekinuto pre prve reči: vraćamo prethodni tekst
          restorePrevious();
        }
      } else {
        // Greška Ollame ili prekid veze
        const code = err instanceof GenerationError ? err.code : "UNKNOWN";
        setGenInfo({ target, status: code === "CONNECTION" ? "connection" : "error", continuations: 0 });
        if (partialText) {
          // Model je stigao nešto da napiše: to čuvamo kao nedovršen nacrt (prethodni sačuvani blog ostaje u „Moji blogovi“)
          setContent(partialText);
          setTextMeta({ options: usedOptions, source: "ai", unfinished: true });
          const ok = await saveAsNewBlog(partialText, usedOptions, "ai", true);
          setNotice(
            ok
              ? "Generisanje nije završeno zbog greške. Tekst napisan do tada je sačuvan kao nedovršen nacrt."
              : "Generisanje nije završeno zbog greške. Tekst napisan do tada je u editoru, ali nije sačuvan.",
          );
        } else {
          restorePrevious();
        }
        setError(
          err instanceof GenerationError
            ? { code: err.code, message: err.message }
            : { code: "UNKNOWN", message: "Došlo je do neočekivane greške. Pokušaj ponovo." },
        );
      }
    } finally {
      finishRun(controller);
    }
  }

  /**
   * "Nastavi generisanje": model dobija dosadašnji tekst i nastavlja od mesta prekida.
   * Dozvoljeno samo kada je tekst odsečen zbog granice dužine, i najviše MAX_CONTINUATIONS puta.
   */
  async function handleContinue() {
    if (!genInfo || genInfo.status !== "length" || genInfo.continuations >= MAX_CONTINUATIONS) return;
    if (busy || !textMeta) return;

    const meta = textMeta;
    const before = content;
    const current = saved;
    const done = genInfo.continuations + 1;
    // Nedovršena poslednja rečenica se odseca, da model nastavi od cele rečenice
    const { kept } = prepareForContinuation(before);

    setError(null);
    setNotice(null);
    setIsGenerating(true);
    setGenInfo({ ...genInfo, status: "running" });

    const controller = new AbortController();
    abortRef.current = controller;
    let continuation = "";
    try {
      const result = await generateWithOllama(
        meta.options,
        (text) => {
          continuation = text;
          setContent(joinContinuation(kept, text));
        },
        controller.signal,
        kept,
      );
      const full = joinContinuation(kept, result.text);
      const unfinished = result.finishReason !== "stop";
      setContent(full);
      setTextMeta({ ...meta, unfinished });
      await persistGenerated(full, meta, unfinished, current);
      setGenInfo({
        target: genInfo.target,
        status: result.finishReason === "stop" ? "complete" : result.finishReason,
        continuations: done,
        ...infoFromEnd(result.end),
      });
      setNotice(
        result.finishReason === "repetition"
          ? "Model je u nastavku počeo da ponavlja isti tekst, pa je zaustavljen. Dopiši kraj ručno — blog je sačuvan kao nedovršen nacrt."
          : !unfinished
          ? "Blog je nastavljen i završen. Proveri spoj između starog i novog dela teksta."
          : done < MAX_CONTINUATIONS
            ? "Tekst ni sada nije završen. Možeš još jednom da klikneš „Nastavi generisanje“."
            : "Ni posle nastavka tekst nije završen. Dopiši kraj ručno — blog je sačuvan kao nedovršen nacrt.",
      );
    } catch (err) {
      const piece = err instanceof GenerationError && err.partial ? err.partial : continuation;
      const tooLong = err instanceof GenerationError && err.code === "TOO_LONG";
      if (!piece.trim() || tooLong) {
        // Model nije ništa dodao: tekst ostaje kakav je bio
        setContent(before);
        setGenInfo({ ...genInfo, continuations: tooLong ? MAX_CONTINUATIONS : genInfo.continuations });
      } else {
        const text = joinContinuation(kept, piece);
        setContent(text);
        const ok = await persistGenerated(text, meta, true, current);
        if (!ok) leaveAfterStopRef.current = null;
        setGenInfo({
          ...genInfo,
          status: controller.signal.aborted ? "aborted" : "error",
          continuations: done,
        });
        setNotice(
          ok
            ? "Nastavak nije završen. Tekst napisan do sada je sačuvan kao nedovršen nacrt."
            : "Nastavak nije završen, a tekst nije sačuvan.",
        );
      }
      if (!controller.signal.aborted) {
        setError(
          err instanceof GenerationError
            ? { code: err.code, message: err.message }
            : { code: "UNKNOWN", message: "Došlo je do neočekivane greške. Pokušaj ponovo." },
        );
      }
    } finally {
      finishRun(controller);
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  /** "Prekini i napusti": prekidamo zahtev, čuvamo tekst, pa prelazimo na izabranu stranicu. */
  function stopAndLeave() {
    const target = leaveTarget;
    setLeaveTarget(null);
    if (!target) return;
    if (abortRef.current) {
      leaveAfterStopRef.current = target;
      abortRef.current.abort();
    } else if (requestNavigation(target)) {
      // Generisanje se u međuvremenu završilo — samo prelazimo
      router.push(target);
    }
  }

  const recentBlogs = [...blogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <>
      <PageHeader title="Novi blog" subtitle="Od ideje do gotovog teksta, uz lokalni AI.">
        <OllamaStatus mode={mode} />
      </PageHeader>

      <div className="grid gap-6 p-6 lg:p-10 xl:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <GeneratorForm
            options={options}
            onChange={setOptions}
            mode={mode}
            onModeChange={(m) => {
              setMode(m);
              setError(null);
            }}
            onGenerate={requestGenerate}
            onStop={handleStop}
            isGenerating={busy}
            canStop={isGenerating && mode === "ai"}
            elapsedSeconds={elapsedSeconds}
          />

          {error && (
            <ErrorAlert
              code={error.code}
              message={error.message}
              onRetry={requestGenerate}
              onUseDemo={() => {
                setMode("demo");
                setError(null);
              }}
              onClose={() => setError(null)}
            />
          )}

          {saveError && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">⚠️ Blog nije sačuvan</p>
              <p className="mt-1">{saveError}</p>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Pokušaj ponovo da sačuvaš
              </button>
            </div>
          )}

          {saved && !saveError && !busy && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
              Blog je sačuvan u „Moji blogovi“ kao nacrt.{" "}
              <GuardedLink href={`/blogovi/${saved.id}`} className="font-medium underline">
                Otvori
              </GuardedLink>
            </p>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Poslednji sačuvani</h3>
              <GuardedLink href="/blogovi" className="text-xs font-medium text-brand-600 hover:underline">
                Svi blogovi →
              </GuardedLink>
            </div>
            {recentBlogs.length === 0 ? (
              <p className="text-sm text-slate-400">Još nema sačuvanih blogova.</p>
            ) : (
              <ul className="space-y-1">
                {recentBlogs.map((blog) => (
                  <li key={blog.id}>
                    <GuardedLink
                      href={`/blogovi/${blog.id}`}
                      className="block rounded-lg px-2 py-2 transition hover:bg-slate-50"
                    >
                      <p className="truncate text-sm font-medium text-slate-800">{blog.title}</p>
                      <p className="text-xs text-slate-500">
                        {LANGUAGES.find((l) => l.value === blog.language)?.label} · {STATUS_LABELS[blog.status]}
                        {blog.unfinished && " (nedovršen)"} · {formatDate(blog.createdAt)}
                      </p>
                    </GuardedLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          {genInfo && (
            <GenerationStatus
              info={genInfo}
              words={countWords(content)}
              elapsedSeconds={elapsedSeconds}
              onContinue={handleContinue}
              disabled={busy}
            />
          )}
        <BlogEditor
          content={content}
          onChange={setContent}
          isGenerating={isGenerating}
          isTyping={isTyping}
          notice={notice}
          onSave={handleSave}
          saveState={saveState}
          waitingText={
            mode === "ai"
              ? elapsedSeconds < 15
                ? "Šaljem temu modelu..."
                : "Model se učitava u memoriju. Prvi put može potrajati i do minut..."
              : undefined
          }
        />
        </div>
      </div>

      <ConfirmDialog
        open={confirmReplace}
        title="Zameniti tekst u editoru?"
        message="U editoru imaš izmene koje nisu sačuvane. Ako generišeš novi blog, te izmene će biti izgubljene. Da ih zadržiš, klikni „Otkaži“, pa „Sačuvaj“."
        confirmLabel="Odbaci izmene i generiši"
        danger
        onConfirm={() => void handleGenerate()}
        onCancel={() => setConfirmReplace(false)}
      />

      <ConfirmDialog
        open={leaveTarget !== null}
        title="Generisanje je u toku"
        message="Ako sada napustiš stranicu, generisanje će biti prekinuto. Tekst napisan do sada biće sačuvan kao nedovršen nacrt u „Moji blogovi“."
        confirmLabel="Prekini i napusti"
        cancelLabel="Ostani"
        danger
        onConfirm={stopAndLeave}
        onCancel={() => setLeaveTarget(null)}
      />
    </>
  );
}
