import type { ErrorCode } from "@/lib/aiClient";

interface Props {
  code: ErrorCode;
  message: string;
  onRetry: () => void;
  onUseDemo: () => void;
  onClose: () => void;
}

const TITLES: Record<ErrorCode, string> = {
  OLLAMA_NOT_RUNNING: "Ollama nije pokrenuta",
  MODEL_NOT_FOUND: "Model nije preuzet",
  OLLAMA_ERROR: "Ollama je prijavila grešku",
  INVALID_INPUT: "Proveri unos",
  NETWORK: "Nema veze sa serverom",
  CONNECTION: "Veza je prekinuta tokom generisanja",
  TOO_LONG: "Tekst je predugačak za nastavak",
  EMPTY: "Model nije vratio tekst",
  UNKNOWN: "Nešto nije u redu",
};

/** Koraci koji korisniku objašnjavaju šta da uradi */
function HelpSteps({ code, message }: { code: ErrorCode; message: string }) {
  if (code === "OLLAMA_NOT_RUNNING") {
    return (
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>Otvori Start meni, ukucaj „Ollama“ i pokreni aplikaciju (ikonica lame se pojavi dole desno).</li>
        <li>
          Ili u PowerShell-u pokreni: <code className="rounded bg-red-100 px-1">ollama serve</code>
        </li>
        <li>Sačekaj par sekundi i klikni „Pokušaj ponovo“.</li>
      </ol>
    );
  }
  if (code === "MODEL_NOT_FOUND") {
    const command = message.match(/ollama pull \S+/)?.[0] ?? "ollama pull qwen2.5:1.5b";
    return (
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>
          U PowerShell-u pokreni: <code className="rounded bg-red-100 px-1">{command}</code>
        </li>
        <li>Sačekaj da se preuzimanje završi, pa klikni „Pokušaj ponovo“.</li>
      </ol>
    );
  }
  return null;
}

export default function ErrorAlert({ code, message, onRetry, onUseDemo, onClose }: Props) {
  const showDemo = code === "OLLAMA_NOT_RUNNING" || code === "MODEL_NOT_FOUND";

  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">⚠️ {TITLES[code]}</p>
          <p className="mt-1 break-words">{message}</p>
          <HelpSteps code={code} message={message} />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zatvori"
          className="shrink-0 rounded-md px-1.5 text-red-500 hover:bg-red-100"
        >
          ✕
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Pokušaj ponovo
        </button>
        {showDemo && (
          <button
            type="button"
            onClick={onUseDemo}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Koristi demo režim
          </button>
        )}
      </div>
    </div>
  );
}
