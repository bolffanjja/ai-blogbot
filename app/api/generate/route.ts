// POST /api/generate
// Prima temu, jezik, ton i dužinu, šalje zahtev lokalnom Ollama modelu
// i vraća tekst postepeno (deo po deo) dok ga model piše.
// Ako zahtev sadrži "continueFrom" (dosadašnji tekst), model NASTAVLJA prekinuti blog.

import { buildContinuationPrompt, buildPrompt, validateOptions } from "@/lib/prompt";
import {
  OLLAMA_MODEL,
  OLLAMA_URL,
  jsonError,
  modelNotFoundMessage,
  ollamaNotRunningMessage,
  ollamaToTextStream,
} from "@/lib/ollama";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Pročitaj i proveri podatke iz forme
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_INPUT", "Neispravan zahtev.");
  }
  const parsed = validateOptions(body);
  if (!parsed.ok) return jsonError(400, "INVALID_INPUT", parsed.message);

  // 2. Napravi uputstvo za model (novi blog ili nastavak prekinutog)
  const continueFrom = (body as { continueFrom?: unknown }).continueFrom;
  let messages: { role: string; content: string }[];
  let numPredict: number;
  let numCtx: number;
  if (continueFrom !== undefined) {
    if (typeof continueFrom !== "string" || !continueFrom.trim() || continueFrom.length > 40000) {
      return jsonError(400, "INVALID_INPUT", "Tekst za nastavak nije ispravan.");
    }
    const prompt = buildContinuationPrompt(parsed.options, continueFrom);
    if (!prompt.ok) return jsonError(400, "TOO_LONG", prompt.message);
    ({ messages, numPredict, numCtx } = prompt);
  } else {
    const prompt = buildPrompt(parsed.options);
    messages = [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ];
    ({ numPredict, numCtx } = prompt);
  }

  // 3. Pošalji zahtev Ollami
  let ollamaResponse: Response;
  try {
    ollamaResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: request.signal, // ako korisnik prekine, prekidamo i Ollamu
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: true,
        keep_alive: "10m", // model ostaje učitan 10 min, pa je sledeći blog brži
        messages,
        options: {
          temperature: 0.7,
          // Kazna za ponavljanje: Ollama podrazumeva 1.1 za poslednja 64 tokena.
          // Malo jača kazna i duži "pogled unazad" smanjuju petlje kao "u dobru gramatiku, u dobru gramatiku...".
          // Temperaturu NE spuštamo: kod malih modela niža temperatura češće izaziva petlje.
          repeat_penalty: 1.15,
          repeat_last_n: 256,
          // Najviše tokena koje model sme da napiše (zaštita; model normalno završi pre toga)
          num_predict: numPredict,
          // Kontekst = uputstvo + ono što model piše. Mora sve da stane, inače model "zaboravi" početak.
          num_ctx: numCtx,
        },
      }),
    });
  } catch {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    return jsonError(503, "OLLAMA_NOT_RUNNING", ollamaNotRunningMessage());
  }

  // 4. Ollama je odgovorila greškom
  if (!ollamaResponse.ok) {
    const text = await ollamaResponse.text().catch(() => "");
    let detail = text;
    try {
      detail = JSON.parse(text).error ?? text;
    } catch {}
    if (ollamaResponse.status === 404 || /not found/i.test(detail)) {
      return jsonError(404, "MODEL_NOT_FOUND", modelNotFoundMessage());
    }
    return jsonError(502, "OLLAMA_ERROR", `Ollama je vratila grešku: ${detail || ollamaResponse.status}`);
  }
  if (!ollamaResponse.body) {
    return jsonError(502, "OLLAMA_ERROR", "Ollama nije vratila odgovor.");
  }

  // 5. Prosledi tekst pregledaču čim stigne
  return new Response(ollamaToTextStream(ollamaResponse.body, { numPredict, numCtx }), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
