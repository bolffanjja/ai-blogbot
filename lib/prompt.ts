// Pravi uputstvo (prompt) za AI model i proverava podatke iz forme.
// Ovaj fajl koristi serverska ruta app/api/generate/route.ts.

import { TARGET_WORDS, type BlogOptions, type Language, type Length, type Tone } from "./options";
import { countWords } from "./text";

const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  sr: "Serbian (srpski jezik), written ONLY in the Latin alphabet (latinica) and ONLY in the ekavian dialect (ekavica: 'vreme', 'reč', 'mleko', 'dete' — never 'vrijeme', 'riječ', 'mlijeko', 'dijete'). Never use Cyrillic letters. Do not use Croatian or Bosnian word forms.",
  en: "English.",
  de: "German (Deutsch).",
};

// Ime jezika kako ga model najbolje razume (koristi se u poslednjem podsetniku)
const LANGUAGE_NAMES: Record<Language, string> = {
  sr: "Serbian (Latin script, ekavian)",
  en: "English",
  de: "German",
};

// Korisnička poruka se piše NA IZABRANOM JEZIKU.
// Mali modeli često odgovaraju na jeziku poslednje poruke koju vide,
// pa engleska poruka ("Topic: ...") lako dovede do bloga na engleskom.
const USER_MESSAGES: Record<Language, (topic: string, words: number) => string> = {
  sr: (topic, words) =>
    `Napiši blog na srpskom jeziku, latinicom i ekavicom.\nTema: ${topic}\nDužina: oko ${words} reči.\nCeo tekst, uključujući naslov i sve podnaslove, mora biti na srpskom jeziku.`,
  en: (topic, words) =>
    `Write a blog post in English.\nTopic: ${topic}\nLength: about ${words} words.\nThe whole text, including the title and all headings, must be in English.`,
  de: (topic, words) =>
    `Schreibe einen Blogartikel auf Deutsch.\nThema: ${topic}\nLänge: etwa ${words} Wörter.\nDer gesamte Text, einschließlich Titel und aller Zwischenüberschriften, muss auf Deutsch sein.`,
};

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  professional: "professional, expert and trustworthy; clear and precise sentences",
  casual: "casual and friendly, like talking to a friend; simple words, a bit of humor",
  inspirational: "inspirational and motivating; encourage the reader to take action",
  educational: "educational; explain step by step, simply, as if teaching a beginner",
};

// ---------- DUŽINA ----------
//
// Model ne broji reči, ali dobro prati STRUKTURU (broj delova i pasusa).
// Zato dužinu zadajemo i brojem reči i strukturom.
const LENGTH_STRUCTURE: Record<Length, string[]> = {
  short: [
    "- an introduction of 2-3 sentences",
    "- exactly 2 sections, each one paragraph of 3-4 sentences",
    "- a conclusion of 2-3 sentences",
  ],
  medium: [
    "- an introduction of 3-4 sentences",
    "- 3 or 4 sections, each 1-2 paragraphs with a concrete example",
    "- a conclusion of one short paragraph",
  ],
  long: [
    "- an introduction of 4-5 sentences",
    "- 5 or 6 sections, each 2 paragraphs with a detailed explanation and a practical example",
    "- a conclusion of one paragraph",
  ],
};

// Naslov zaključka na izabranom jeziku (da se ne bi pojavio "Concluding thoughts" u srpskom tekstu)
export const CONCLUSION_HEADINGS: Record<Language, string> = {
  sr: "Zaključak",
  en: "Conclusion",
  de: "Fazit",
};

// ---------- TOKENI ----------
//
// Model ne piše reči nego TOKENE (delove reči). Srpske reči sa č, ć, š, ž, đ
// model deli na više delova nego engleske, pa isti broj reči na srpskom troši više tokena.
// Ovo su PROCENE (za koliko tokena je potrebna jedna reč); tačan broj se vidi u statusu
// posle generisanja ("tokena modela"), pa vrednosti možemo da podesimo prema merenju.
export const TOKENS_PER_WORD: Record<Language, number> = {
  sr: 3.0,
  de: 2.2,
  en: 1.6,
};

/** Odstupanje od ciljnog broja reči koje prihvatamo (±15%). */
export const WORD_TOLERANCE = 0.15;

/** Procena koliko tokena zauzimaju sistemska poruka i tema (sa rezervom). */
const PROMPT_TOKENS_ESTIMATE = 700;
/** Najveći kontekst koji dozvoljavamo na računaru sa 8 GB RAM-a. */
export const MAX_CONTEXT = 8192;

const roundUpTo1024 = (n: number) => Math.ceil(n / 1024) * 1024;

/**
 * Koliko tokena model sme da napiše (num_predict) i koliki mu je kontekst (num_ctx).
 * num_predict = cilj + 15% + rezerva za naslove i Markdown → model normalno završi SAM, pre ove granice.
 * Granica je samo zaštita da model ne piše beskonačno.
 */
export function generationLimits(language: Language, words: number, extraPromptTokens = 0) {
  const numPredict = Math.ceil(words * (1 + WORD_TOLERANCE) * TOKENS_PER_WORD[language] + 150);
  const numCtx = Math.min(MAX_CONTEXT, roundUpTo1024(PROMPT_TOKENS_ESTIMATE + extraPromptTokens + numPredict));
  return { numPredict, numCtx };
}

/** Gruba procena broja tokena u tekstu (za proveru da li stane u kontekst). */
export function estimateTokens(text: string, language: Language): number {
  return Math.ceil(countWords(text) * TOKENS_PER_WORD[language] + text.length / 40);
}

export function buildPrompt(options: BlogOptions) {
  const words = TARGET_WORDS[options.length];
  const low = Math.round(words * (1 - WORD_TOLERANCE));
  const high = Math.round(words * (1 + WORD_TOLERANCE));
  const conclusion = CONCLUSION_HEADINGS[options.language];

  const system = [
    "You are an experienced blog writer.",
    `Write the whole blog post in ${LANGUAGE_INSTRUCTIONS[options.language]}`,
    `Tone: ${TONE_INSTRUCTIONS[options.tone]}.`,
    "Format the answer in Markdown:",
    "- first line: the title starting with '# '",
    ...LENGTH_STRUCTURE[options.length],
    "- every section starts with '## ' and a meaningful heading",
    `- the last section is exactly '## ${conclusion}'`,
    "- you may use '- ' bullet lists and **bold** text",
    `Total length: about ${words} words (between ${low} and ${high}). It is fine to be a bit shorter; never pad the text with filler sentences.`,
    "Always finish the post: end with the conclusion and a complete sentence.",
    "Do not invent sources, statistics, studies or quotes.",
    "Return ONLY the blog post. No notes, no explanations, no code blocks.",
    `All headings, including the conclusion heading, must also be in ${LANGUAGE_NAMES[options.language]}.`,
    `Write in ${LANGUAGE_NAMES[options.language]} even if the topic is written in another language.`,
  ].join("\n");

  const user = USER_MESSAGES[options.language](options.topic.trim(), words);
  const { numPredict, numCtx } = generationLimits(options.language, words);

  return { system, user, numPredict, numCtx, targetWords: words };
}

// ---------- NASTAVAK GENERISANJA ----------

const CONTINUE_MESSAGES: Record<Language, (conclusion: string) => string> = {
  sr: (c) =>
    `Tekst iznad je prekinut. Nastavi tačno od mesta gde je stao. Ne ponavljaj ništa što je već napisano, ne piši novi naslov i ne menjaj prethodni tekst. Napiši samo ono što nedostaje i završi blog odeljkom „## ${c}“.`,
  en: (c) =>
    `The text above was cut off. Continue exactly where it stopped. Do not repeat anything already written, do not write a new title and do not change the previous text. Write only what is missing and finish the post with the section '## ${c}'.`,
  de: (c) =>
    `Der Text oben wurde abgebrochen. Setze genau dort fort, wo er aufgehört hat. Wiederhole nichts, schreibe keinen neuen Titel und ändere den bisherigen Text nicht. Schreibe nur, was fehlt, und beende den Artikel mit dem Abschnitt „## ${c}“.`,
};

export type ContinuationPrompt =
  | { ok: true; messages: { role: "system" | "user" | "assistant"; content: string }[]; numPredict: number; numCtx: number }
  | { ok: false; message: string };

/**
 * Pravi zahtev za nastavak prekinutog bloga: model vidi originalno uputstvo,
 * svoj dosadašnji tekst i molbu da nastavi bez ponavljanja.
 */
export function buildContinuationPrompt(options: BlogOptions, existingText: string): ContinuationPrompt {
  const base = buildPrompt(options);
  const written = countWords(existingText);
  // Koliko još nedostaje do cilja (ali bar toliko da stane zaključak)
  const remaining = Math.max(base.targetWords - written, 120);
  const existingTokens = estimateTokens(existingText, options.language);
  const { numPredict, numCtx } = generationLimits(options.language, remaining, existingTokens);

  if (PROMPT_TOKENS_ESTIMATE + existingTokens + numPredict > MAX_CONTEXT) {
    return {
      ok: false,
      message:
        "Tekst je predugačak da bi ga model video ceo i nastavio. Dopiši kraj ručno u editoru ili generiši kraći blog.",
    };
  }

  return {
    ok: true,
    messages: [
      { role: "system", content: base.system },
      { role: "user", content: base.user },
      { role: "assistant", content: existingText },
      { role: "user", content: CONTINUE_MESSAGES[options.language](CONCLUSION_HEADINGS[options.language]) },
    ],
    numPredict,
    numCtx,
  };
}

type ValidationResult = { ok: true; options: BlogOptions } | { ok: false; message: string };

export function validateOptions(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, message: "Neispravan zahtev." };
  }
  const data = input as Record<string, unknown>;
  const topic = typeof data.topic === "string" ? data.topic.trim() : "";

  if (topic.length < 3) return { ok: false, message: "Tema mora imati bar 3 karaktera." };
  if (topic.length > 200) return { ok: false, message: "Tema može imati najviše 200 karaktera." };
  if (!["sr", "en", "de"].includes(data.language as string)) {
    return { ok: false, message: "Izabrani jezik nije podržan." };
  }
  if (!["professional", "casual", "inspirational", "educational"].includes(data.tone as string)) {
    return { ok: false, message: "Izabrani ton nije podržan." };
  }
  if (!["short", "medium", "long"].includes(data.length as string)) {
    return { ok: false, message: "Izabrana dužina nije podržana." };
  }

  return {
    ok: true,
    options: {
      topic,
      language: data.language as Language,
      tone: data.tone as Tone,
      length: data.length as Length,
    },
  };
}
