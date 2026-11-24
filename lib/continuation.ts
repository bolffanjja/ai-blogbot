// Pomoćne funkcije za "Nastavi generisanje".
// Čiste funkcije (bez React-a i bez mreže), pa je lako testirati.

/**
 * Model je prekinut usred rečenice (npr. "...ovo je važno jer omo").
 * Pre nastavka odsecamo taj nedovršeni komad, da model nastavi od CELE rečenice.
 * Sve pre toga ostaje netaknuto.
 */
export function prepareForContinuation(text: string): { kept: string; removedTail: string } {
  const trimmed = text.replace(/\s+$/, "");
  // Tekst se već završava celom rečenicom → ništa ne odsecamo
  if (/[.!?…:]["'”»)]*$/.test(trimmed)) {
    return { kept: trimmed, removedTail: "" };
  }
  // Poslednji kraj rečenice ili prelom reda
  let cut = -1;
  const sentenceEnd = /[.!?…]["'”»)]*(?=\s)/g;
  let m: RegExpExecArray | null;
  while ((m = sentenceEnd.exec(trimmed))) cut = m.index + m[0].length;
  const lineBreak = trimmed.lastIndexOf("\n");
  cut = Math.max(cut, lineBreak);
  if (cut <= 0) return { kept: trimmed, removedTail: "" };
  return { kept: trimmed.slice(0, cut).replace(/\s+$/, ""), removedTail: trimmed.slice(cut).trim() };
}

const normalize = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * Spaja postojeći tekst i nastavak:
 * - uklanja novi naslov (# ...) ako ga je model ipak napisao,
 * - uklanja pasuse koji su doslovno isti kao već napisani,
 * - stavlja razmak ili prazan red između, zavisno od toga čime nastavak počinje.
 */
export function joinContinuation(kept: string, continuation: string): string {
  const existing = new Set(
    kept
      .split(/\n\s*\n/)
      .map(normalize)
      .filter(Boolean),
  );
  const cleaned = continuation
    .replace(/^\s*#\s+[^\n]*\n?/, "") // novi naslov na početku
    .split(/\n\s*\n/)
    .filter((block) => !existing.has(normalize(block)))
    .join("\n\n")
    .trimStart();

  if (!cleaned) return kept;
  if (!kept) return cleaned;
  // Nastavak počinje naslovom, listom ili posle praznog reda → novi pasus
  const startsBlock = /^(#{1,6}\s|[-*+]\s|\d+[.)]\s)/.test(cleaned) || /^\s*\n/.test(continuation);
  const keptEndsLine = /\n$/.test(kept) || /^(#{1,6}\s|[-*+]\s|\d+[.)]\s)/.test(kept.slice(kept.lastIndexOf("\n") + 1));
  return `${kept}${startsBlock || keptEndsLine ? "\n\n" : " "}${cleaned}`;
}
