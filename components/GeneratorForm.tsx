"use client";

import { LANGUAGES, LENGTHS, MODES, TONES, type BlogOptions, type Mode } from "@/lib/options";

interface Props {
  options: BlogOptions;
  onChange: (options: BlogOptions) => void;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onGenerate: () => void;
  onStop: () => void;
  isGenerating: boolean;
  canStop: boolean;
  elapsedSeconds: number;
}

const EXAMPLES = ["Zdrava ishrana", "Rad od kuće", "Veštačka inteligencija u marketingu"];
const MAX_TOPIC = 200;

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function GeneratorForm({
  options,
  onChange,
  mode,
  onModeChange,
  onGenerate,
  onStop,
  isGenerating,
  canStop,
  elapsedSeconds,
}: Props) {
  const set = <K extends keyof BlogOptions>(key: K, value: BlogOptions[K]) =>
    onChange({ ...options, [key]: value });

  const topicLength = options.topic.trim().length;
  const canGenerate = topicLength >= 3 && topicLength <= MAX_TOPIC && !isGenerating;

  return (
    <form
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (canGenerate) onGenerate();
      }}
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Novi blog</h2>
        <p className="text-sm text-slate-500">Unesi temu i podesi stil teksta.</p>
      </div>

      {/* Režim: pravi AI ili demo */}
      <fieldset disabled={isGenerating}>
        <legend className="mb-1.5 block text-sm font-medium text-slate-700">Način generisanja</legend>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {MODES.map((m) => {
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => onModeChange(m.value)}
                className={`rounded-lg px-2 py-2 text-center transition disabled:cursor-not-allowed ${
                  active ? "bg-white shadow-sm" : "hover:bg-slate-50"
                }`}
              >
                <p className={`text-sm font-medium ${active ? "text-slate-900" : "text-slate-600"}`}>
                  {m.label}
                </p>
                <p className="text-[11px] text-slate-500">{m.description}</p>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Tema */}
      <div>
        <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-slate-700">
          Tema bloga
        </label>
        <textarea
          id="topic"
          rows={3}
          value={options.topic}
          disabled={isGenerating}
          maxLength={MAX_TOPIC + 50}
          onChange={(e) => set("topic", e.target.value)}
          placeholder="Npr. Kako početi sa trčanjem posle 30. godine"
          className={`w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-4 disabled:bg-slate-50 ${
            topicLength > MAX_TOPIC
              ? "border-red-400 focus:border-red-500 focus:ring-red-100"
              : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
          }`}
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-red-600">
            {topicLength > 0 && topicLength < 3 && "Tema mora imati bar 3 karaktera."}
            {topicLength > MAX_TOPIC && `Tema može imati najviše ${MAX_TOPIC} karaktera.`}
          </span>
          <span className={topicLength > MAX_TOPIC ? "text-red-600" : "text-slate-400"}>
            {topicLength}/{MAX_TOPIC}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={isGenerating}
              onClick={() => set("topic", ex)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Jezik */}
      <div>
        <label htmlFor="language" className="mb-1.5 block text-sm font-medium text-slate-700">
          Jezik
        </label>
        <select
          id="language"
          disabled={isGenerating}
          value={options.language}
          onChange={(e) => set("language", e.target.value as BlogOptions["language"])}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.flag} {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* Ton */}
      <fieldset disabled={isGenerating}>
        <legend className="mb-1.5 block text-sm font-medium text-slate-700">Ton</legend>
        <div className="grid grid-cols-2 gap-2">
          {TONES.map((t) => {
            const active = options.tone === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => set("tone", t.value)}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-brand-500 bg-brand-50 ring-2 ring-brand-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className={`text-sm font-medium ${active ? "text-brand-700" : "text-slate-800"}`}>
                  {t.label}
                </p>
                <p className="text-xs text-slate-500">{t.description}</p>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Dužina */}
      <fieldset disabled={isGenerating}>
        <legend className="mb-1.5 block text-sm font-medium text-slate-700">Dužina</legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
          {LENGTHS.map((l) => {
            const active = options.length === l.value;
            return (
              <button
                key={l.value}
                type="button"
                onClick={() => set("length", l.value)}
                className={`rounded-lg px-2 py-2 text-center transition ${
                  active ? "bg-white shadow-sm" : "hover:bg-slate-50"
                }`}
              >
                <p className={`text-sm font-medium ${active ? "text-slate-900" : "text-slate-600"}`}>
                  {l.label}
                </p>
                <p className="text-[11px] text-slate-500">{l.hint}</p>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!canGenerate}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Generišem... {mode === "ai" && formatTime(elapsedSeconds)}
            </>
          ) : (
            <>✨ Generiši blog</>
          )}
        </button>
        {canStop && (
          <button
            type="button"
            onClick={onStop}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Prekini
          </button>
        )}
      </div>
      {isGenerating && mode === "ai" && (
        <p className="-mt-3 text-center text-xs text-slate-500">
          Lokalni model piše na tvom računaru. Blog može trajati 1–3 minuta.
        </p>
      )}
    </form>
  );
}
