// GET /api/ollama-status
// Proverava da li je Ollama pokrenuta i da li je model preuzet.

import { OLLAMA_MODEL, OLLAMA_URL } from "@/lib/ollama";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as { models?: { name: string }[] };
    const models = (data.models ?? []).map((m) => m.name);
    const modelInstalled = models.some(
      (name) => name === OLLAMA_MODEL || name === `${OLLAMA_MODEL}:latest`,
    );
    return Response.json({ running: true, model: OLLAMA_MODEL, modelInstalled, models });
  } catch {
    return Response.json({ running: false, model: OLLAMA_MODEL, modelInstalled: false, models: [] });
  }
}
