// Pomoćne funkcije za komunikaciju sa Ollamom. Koriste se SAMO na serveru.

import { findRepetitionLoop } from "./repetition";

export const OLLAMA_URL = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:1.5b";

// Posebni znak kojim server javlja pregledaču nešto "van teksta" (greška, kraj generisanja).
// Pregledač ga uklanja pre prikaza. Znak \u0000 se nikad ne pojavljuje u običnom tekstu.
export const MARKER = "\u0000";

/**
 * Šta Ollama javlja na kraju generisanja. Šalje se pregledaču kao `\u0000END:{...}`.
 * reason: "stop" = model je sam završio, "length" = dostigao je granicu tokena (num_predict),
 *         "repetition" = server je zaustavio model jer je počeo da ponavlja isti tekst u krug.
 * Ako ovaj znak NE stigne, veza je prekinuta pre kraja.
 */
export interface GenerationEnd {
  reason: string;
  /** Broj tokena koje je model napisao */
  outputTokens: number | null;
  /** Broj tokena uputstva koje je model pročitao */
  promptTokens: number | null;
  /** Koliko je trajalo pisanje (ms) */
  writeMs: number | null;
  /** Koliko je trajalo ceo zahtev, uključujući učitavanje modela (ms) */
  totalMs: number | null;
  /** Granica tokena i kontekst koje smo zadali */
  numPredict: number;
  numCtx: number;
}

const nsToMs = (ns: unknown) => (typeof ns === "number" ? Math.round(ns / 1e6) : null);

export function jsonError(status: number, code: string, message: string) {
  return Response.json({ code, message }, { status });
}

export function ollamaNotRunningMessage() {
  return `Ollama nije pokrenuta ili nije dostupna na adresi ${OLLAMA_URL}.`;
}

export function modelNotFoundMessage() {
  return `Model „${OLLAMA_MODEL}“ nije preuzet. U PowerShell-u pokreni: ollama pull ${OLLAMA_MODEL}`;
}

/**
 * Ollama šalje odgovor kao niz JSON redova (jedan red = jedan mali deo teksta).
 * Ova funkcija ih pretvara u običan tekst koji pregledač može odmah da prikazuje.
 */
export function ollamaToTextStream(
  body: ReadableStream<Uint8Array>,
  limits: { numPredict: number; numCtx: number },
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  // Sav tekst koji je model do sada napisao (za proveru ponavljanja)
  let generated = "";
  // true = zaustavili smo model zbog ponavljanja, ne čitamo dalje
  let stopped = false;

  let sentSomething = false;

  const handleLine = (line: string, controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (!line.trim() || stopped) return;
    const send = (text: string) => {
      controller.enqueue(encoder.encode(text));
      sentSomething = true;
    };
    let data: {
      message?: { content?: string };
      error?: string;
      done?: boolean;
      done_reason?: string;
      eval_count?: number;
      prompt_eval_count?: number;
      eval_duration?: number;
      total_duration?: number;
    };
    try {
      data = JSON.parse(line);
    } catch {
      return; // preskoči nepotpun ili neispravan red
    }
    if (data.error) {
      send(`${MARKER}ERROR:${data.error}`);
      return;
    }
    if (data.message?.content) {
      send(data.message.content);
      generated += data.message.content;
      // Model se "zaglavio" i piše isto u krug → zaustavljamo ga, da ne troši procesor
      if (findRepetitionLoop(generated) !== null) {
        stopped = true;
        const end: GenerationEnd = {
          reason: "repetition",
          outputTokens: null,
          promptTokens: null,
          writeMs: null,
          totalMs: null,
          ...limits,
        };
        console.info("[AI BlogBot] Model je zaustavljen jer ponavlja isti tekst:", end);
        send(`${MARKER}END:${JSON.stringify(end)}`);
        return;
      }
    }
    if (data.done) {
      const end: GenerationEnd = {
        reason: data.done_reason ?? "stop",
        outputTokens: data.eval_count ?? null,
        promptTokens: data.prompt_eval_count ?? null,
        writeMs: nsToMs(data.eval_duration),
        totalMs: nsToMs(data.total_duration),
        ...limits,
      };
      // Dijagnostika u terminalu gde radi "npm run dev"
      console.info("[AI BlogBot] Ollama završila:", end);
      send(`${MARKER}END:${JSON.stringify(end)}`);
    }
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        // Čitamo dok ne pošaljemo bar jedan deo - inače bi stream stao i čekao zauvek
        sentSomething = false;
        while (!sentSomething) {
          const { done, value } = await reader.read();
          if (done) {
            buffer += decoder.decode();
            handleLine(buffer, controller);
            controller.close();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) handleLine(line, controller);
          if (stopped) {
            // Prekidamo vezu sa Ollamom — ona tada prestaje da generiše
            controller.close();
            await reader.cancel().catch(() => {});
            return;
          }
        }
      } catch {
        // Veza sa Ollamom je prekinuta usred pisanja
        controller.enqueue(encoder.encode(`${MARKER}ERROR:Veza sa Ollamom je prekinuta tokom generisanja.`));
        controller.close();
      }
    },
    cancel() {
      // Korisnik je kliknuo "Prekini" - zaustavljamo i Ollamu
      return reader.cancel();
    },
  });
}
