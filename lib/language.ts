// Gruba provera na kom jeziku je napisan tekst.
// Ne menja tekst — služi samo da korisniku kažemo ako je mali model
// ignorisao izabrani jezik (npr. napisao blog na engleskom umesto na srpskom).
//
// Kako radi: broji česte kratke reči (veznike, predloge) karakteristične za svaki jezik.
// Ako nije sigurna, vraća null — tada ništa ne prijavljujemo.

import { LANGUAGES, type Language } from "./options";

const COMMON_WORDS: Record<Language, string[]> = {
  sr: ["je", "i", "u", "da", "se", "na", "za", "su", "od", "što", "koji", "koja", "kao", "ili", "ali", "nije", "može", "sa", "kako", "ste", "će", "biti"],
  en: ["the", "and", "is", "of", "to", "that", "it", "for", "are", "with", "this", "you", "can", "be", "your", "or", "how", "on"],
  de: ["der", "die", "das", "und", "ist", "nicht", "mit", "sie", "ein", "eine", "zu", "auf", "für", "sich", "auch", "wird", "den", "von"],
};

export function detectLanguage(text: string): Language | null {
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.length < 30) return null; // premalo teksta za pouzdanu procenu

  const scores = (Object.keys(COMMON_WORDS) as Language[])
    .map((language) => {
      const set = new Set(COMMON_WORDS[language]);
      return { language, score: words.filter((w) => set.has(w)).length };
    })
    .sort((a, b) => b.score - a.score);

  const [first, second] = scores;
  // Pobednik mora da ima dovoljno pogodaka i jasnu prednost
  if (first.score < 5 || first.score < second.score * 2) return null;
  return first.language;
}

/** Deo slova koja su ćirilica (0 do 1). */
export function cyrillicShare(text: string): number {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (letters.length === 0) return 0;
  const cyrillic = letters.filter((ch) => /\p{Script=Cyrillic}/u.test(ch)).length;
  return cyrillic / letters.length;
}

const LANGUAGE_IN_SENTENCE: Record<Language, string> = {
  sr: "srpskom",
  en: "engleskom",
  de: "nemačkom",
};

/**
 * Upozorenje za korisnika ako tekst nije na izabranom jeziku/pismu, inače null.
 * Ne menja izabrani jezik — samo obaveštava.
 */
export function languageWarning(text: string, selected: Language): string | null {
  if (selected === "sr" && cyrillicShare(text) > 0.2) {
    return "Model je napisao tekst ćirilicom umesto latinicom. Mali lokalni model ponekad ne poštuje uputstvo — probaj da generišeš ponovo.";
  }
  const detected = detectLanguage(text);
  if (!detected || detected === selected) return null;
  const selectedLabel = LANGUAGES.find((l) => l.value === selected)?.label ?? selected;
  return (
    `Izgleda da je model napisao tekst na ${LANGUAGE_IN_SENTENCE[detected]} jeziku, a izabran je ${selectedLabel.toLowerCase()}. ` +
    "Mali lokalni model ponekad ne poštuje uputstvo — probaj da generišeš ponovo."
  );
}
