// Traka iznad editora: cilj, stvaran broj reči i kako se generisanje završilo.
// Npr. "Cilj: 250 reči | Generisano: 237 reči | Završeno".
// Nema procenata napretka — model ne zna unapred koliko će napisati.

import { WORD_TOLERANCE } from "@/lib/prompt";

/** Koliko puta korisnik može da klikne "Nastavi generisanje" za jedan blog (štedi slab računar). */
export const MAX_CONTINUATIONS = 2;

export type GenerationStatusKind =
  | "running" // model piše
  | "complete" // model je sam završio tekst
  | "length" // model je stigao do granice tokena — tekst nije završen
  | "repetition" // model je počeo da ponavlja isti tekst, pa je zaustavljen
  | "aborted" // korisnik je prekinuo
  | "error" // greška Ollame
  | "connection"; // veza je prekinuta pre kraja

export interface GenerationInfo {
  target: number;
  status: GenerationStatusKind;
  /** Koliko puta je već korišćeno "Nastavi generisanje" */
  continuations: number;
  /** Podaci iz Ollame posle završetka */
  outputTokens?: number | null;
  writeMs?: number | null;
  numPredict?: number;
}

const STATUS: Record<GenerationStatusKind, { text: string; className: string }> = {
  running: { text: "U toku…", className: "text-slate-600" },
  complete: { text: "Završeno", className: "text-emerald-700" },
  length: { text: "Generisanje nije završeno (dostignuta granica dužine)", className: "text-amber-700" },
  aborted: { text: "Prekinuto", className: "text-amber-700" },
  repetition: { text: "Zaustavljeno: model je počeo da ponavlja isti tekst", className: "text-amber-700" },
  error: { text: "Greška — generisanje nije završeno", className: "text-red-700" },
  connection: { text: "Veza prekinuta — generisanje nije završeno", className: "text-red-700" },
};

const fmt = (n: number) => n.toLocaleString("sr-Latn-RS");
const duration = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function GenerationStatus({
  info,
  words,
  elapsedSeconds,
  onContinue,
  disabled,
}: {
  info: GenerationInfo;
  words: number;
  elapsedSeconds: number;
  onContinue: () => void;
  disabled: boolean;
}) {
  const status = STATUS[info.status];
  const low = Math.round(info.target * (1 - WORD_TOLERANCE));
  const high = Math.round(info.target * (1 + WORD_TOLERANCE));
  const canContinue = info.status === "length" && info.continuations < MAX_CONTINUATIONS;
  const speed =
    info.outputTokens && info.writeMs ? (info.outputTokens / (info.writeMs / 1000)).toFixed(1).replace(".", ",") : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className="text-slate-600">
          Cilj: <strong className="font-semibold text-slate-900">{fmt(info.target)}</strong> reči
        </span>
        <span className="text-slate-300" aria-hidden="true">|</span>
        <span className="text-slate-600">
          Generisano: <strong className="font-semibold text-slate-900">{fmt(words)}</strong> reči
        </span>
        <span className="text-slate-300" aria-hidden="true">|</span>
        <span role="status" className={`font-medium ${status.className}`}>
          {status.text}
          {info.status === "running" && ` (${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")})`}
        </span>
        {canContinue && (
          <button
            type="button"
            onClick={onContinue}
            disabled={disabled}
            className="ml-auto rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            Nastavi generisanje
          </button>
        )}
      </div>
      {info.status !== "running" && (
        <p className="mt-1 text-xs text-slate-500">
          Očekivani raspon: {fmt(low)}–{fmt(high)} reči
          {info.outputTokens != null && ` · Model: ${fmt(info.outputTokens)} tokena`}
          {info.numPredict != null && ` (granica ${fmt(info.numPredict)})`}
          {info.writeMs != null && ` · pisanje ${duration(info.writeMs)}`}
          {speed && ` · ${speed} tokena/s`}
          {info.continuations > 0 && ` · nastavljeno ${info.continuations}×`}
        </p>
      )}
    </div>
  );
}
