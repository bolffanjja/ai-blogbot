// Kod koji radi u pregledaču: šalje zahtev našoj ruti /api/generate
// i čita tekst deo po deo, dok ga model piše.

import type { BlogOptions } from "./options";
import type { GenerationEnd } from "./ollama";
import { removeRepetitionLoop } from "./repetition";

const MARKER = "\u0000";

export type ErrorCode =
  | "OLLAMA_NOT_RUNNING"
  | "MODEL_NOT_FOUND"
  | "OLLAMA_ERROR"
  | "INVALID_INPUT"
  | "NETWORK"
  | "CONNECTION"
  | "TOO_LONG"
  | "EMPTY"
  | "UNKNOWN";

export class GenerationError extends Error {
  code: ErrorCode;
  /** Tekst koji je model stigao da napiše pre greške (može biti prazan) */
  partial: string;
  constructor(code: ErrorCode, message: string, partial = "") {
    super(message);
    this.code = code;
    this.partial = partial;
  }
}

/**
 * Kako se generisanje završilo:
 * - "stop"   = model je sam završio tekst
 * - "length" = model je dostigao granicu tokena, tekst verovatno nije završen
 * - "repetition" = model je počeo da piše isto u krug i server ga je zaustavio
 */
export type FinishReason = "stop" | "length" | "repetition";

export interface GenerationResult {
  text: string;
  finishReason: FinishReason;
  /** Podaci koje Ollama javlja na kraju (broj tokena, trajanje) */
  end: GenerationEnd;
}

/** Mali modeli ponekad tekst umotaju u ```markdown ... ``` - to uklanjamo. */
export function cleanModelText(text: string): string {
  return text
    .replace(/^\s*```(?:markdown|md)?\s*\n/i, "")
    .replace(/\n```\s*$/, "")
    .trimStart();
}

/**
 * Šalje zahtev serveru i čita tekst dok ga model piše.
 * `continueFrom` = dosadašnji tekst, kada korisnik traži "Nastavi generisanje"
 * (tada onText dobija SAMO nastavak, ne ceo tekst).
 */
export async function generateWithOllama(
  options: BlogOptions,
  onText: (textSoFar: string) => void,
  signal: AbortSignal,
  continueFrom?: string,
): Promise<GenerationResult> {
  let response: Response;
  try {
    response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(continueFrom === undefined ? options : { ...options, continueFrom }),
      signal,
    });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new GenerationError(
      "NETWORK",
      "Ne mogu da se povežem sa serverom aplikacije. Proveri da li je „npm run dev“ i dalje pokrenut.",
    );
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { code?: ErrorCode; message?: string } | null;
    throw new GenerationError(data?.code ?? "UNKNOWN", data?.message ?? `Server je vratio grešku ${response.status}.`);
  }
  if (!response.body) throw new GenerationError("UNKNOWN", "Server nije vratio tekst.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  const textSoFar = () => cleanModelText(raw.split(MARKER)[0]).trimEnd();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += decoder.decode(value, { stream: true });
      onText(cleanModelText(raw.split(MARKER)[0]));
    }
    raw += decoder.decode();
  } catch (err) {
    if (signal.aborted) throw err;
    // Veza između browsera i servera je pukla usred pisanja
    throw new GenerationError(
      "CONNECTION",
      "Veza sa serverom je prekinuta pre kraja generisanja.",
      textSoFar(),
    );
  }

  // Posebne poruke koje server šalje na kraju teksta
  const [, ...markers] = raw.split(MARKER);
  const text = textSoFar();
  const errorMarker = markers.find((m) => m.startsWith("ERROR:"));
  const endMarker = markers.find((m) => m.startsWith("END:"));

  if (errorMarker) {
    const message = errorMarker.slice("ERROR:".length);
    if (/not found/i.test(message)) throw new GenerationError("MODEL_NOT_FOUND", message, text);
    if (/prekinuta/i.test(message)) throw new GenerationError("CONNECTION", message, text);
    throw new GenerationError("OLLAMA_ERROR", `Ollama je prijavila grešku: ${message}`, text);
  }
  if (!endMarker) {
    // Tok se završio, a Ollama nije javila kraj → nešto je prekinulo vezu
    if (signal.aborted) throw new DOMException("Prekinuto", "AbortError");
    throw new GenerationError("CONNECTION", "Ollama je prestala da šalje tekst pre nego što je javila kraj.", text);
  }
  if (!text) {
    throw new GenerationError("EMPTY", "Model nije vratio tekst. Pokušaj ponovo ili promeni temu.");
  }

  const end = JSON.parse(endMarker.slice("END:".length)) as GenerationEnd;
  if (end.reason === "repetition") {
    // Ponovljeni deo uklanjamo, ostaje samo prvo pojavljivanje
    const cleaned = removeRepetitionLoop(text);
    onText(cleaned);
    return { text: cleaned, finishReason: "repetition", end };
  }
  onText(text);
  return { text, finishReason: end.reason === "length" ? "length" : "stop", end };
}
