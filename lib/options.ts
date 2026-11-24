// Opcije koje korisnik bira u formi.
// Kada budemo dodali pravi AI, ove iste vrednosti šaljemo u prompt.

export type Language = "sr" | "en" | "de";
export type Tone = "professional" | "casual" | "inspirational" | "educational";
export type Length = "short" | "medium" | "long";

export interface BlogOptions {
  topic: string;
  language: Language;
  tone: Tone;
  length: Length;
}

export const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: "sr", label: "Srpski", flag: "🇷🇸" },
  { value: "en", label: "Engleski", flag: "🇬🇧" },
  { value: "de", label: "Nemački", flag: "🇩🇪" },
];

export const TONES: { value: Tone; label: string; description: string }[] = [
  { value: "professional", label: "Profesionalan", description: "Ozbiljan i stručan" },
  { value: "casual", label: "Opušten", description: "Prijateljski, kao razgovor" },
  { value: "inspirational", label: "Inspirativan", description: "Motiviše na akciju" },
  { value: "educational", label: "Edukativan", description: "Objašnjava korak po korak" },
];

// Ciljni broj reči za AI (dozvoljeno je oko ±15%). Ovo je JEDINO mesto gde se cilj određuje:
// koriste ga i forma, i prompt (lib/prompt.ts), i prikaz "Cilj: ... reči".
// Demo režim pravi nešto kraće tekstove.
export const TARGET_WORDS: Record<Length, number> = {
  short: 250,
  medium: 500,
  long: 1000,
};

export const LENGTHS: { value: Length; label: string; hint: string }[] = [
  { value: "short", label: "Kratak", hint: "~250 reči" },
  { value: "medium", label: "Srednji", hint: "~500 reči" },
  { value: "long", label: "Dugačak", hint: "~1.000 reči" },
];

// "ai" = lokalni model preko Ollame, "demo" = šabloni bez AI-ja
export type Mode = "ai" | "demo";

export const MODES: { value: Mode; label: string; description: string }[] = [
  { value: "ai", label: "AI (Ollama)", description: "Lokalni model, sporije" },
  { value: "demo", label: "Demo", description: "Šabloni, odmah" },
];
