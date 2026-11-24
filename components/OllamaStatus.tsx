"use client";

import { useCallback, useEffect, useState } from "react";
import type { Mode } from "@/lib/options";

interface Status {
  running: boolean;
  model: string;
  modelInstalled: boolean;
}

/** Oznaka u zaglavlju: da li je Ollama pokrenuta i da li je model preuzet. */
export default function OllamaStatus({ mode }: { mode: Mode }) {
  const [status, setStatus] = useState<Status | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/ollama-status", { cache: "no-store" });
      setStatus((await res.json()) as Status);
    } catch {
      setStatus({ running: false, model: "", modelInstalled: false });
    }
  }, []);

  useEffect(() => {
    if (mode !== "ai") return;
    check();
    const id = setInterval(check, 15000); // proveravamo na svakih 15 sekundi
    return () => clearInterval(id);
  }, [mode, check]);

  if (mode === "demo") {
    return <Badge color="amber" text="Demo režim · bez AI-ja" />;
  }
  if (!status) return <Badge color="slate" text="Proveravam Ollamu..." />;
  if (!status.running) return <Badge color="red" text="Ollama nije pokrenuta" onClick={check} />;
  if (!status.modelInstalled)
    return <Badge color="red" text={`Model ${status.model} nije preuzet`} onClick={check} />;
  return <Badge color="green" text={`Ollama · ${status.model}`} />;
}

const COLORS = {
  amber: "bg-amber-50 text-amber-700 ring-amber-200 [&>span]:bg-amber-500",
  slate: "bg-slate-50 text-slate-600 ring-slate-200 [&>span]:bg-slate-400",
  red: "bg-red-50 text-red-700 ring-red-200 [&>span]:bg-red-500",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200 [&>span]:bg-emerald-500",
};

function Badge({ color, text, onClick }: { color: keyof typeof COLORS; text: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={onClick ? "Klikni da ponovo proveriš" : undefined}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${COLORS[color]} ${
        onClick ? "cursor-pointer hover:opacity-80" : "cursor-default"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full" />
      {text}
    </button>
  );
}
