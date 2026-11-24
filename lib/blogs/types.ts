// Kako izgleda jedan sačuvani blog.
// Ovaj tip ostaje isti i kada umesto localStorage-a pređemo na pravu bazu.

import type { Language, Length, Mode, Tone } from "../options";

export type BlogStatus = "draft" | "done";

export const STATUS_LABELS: Record<BlogStatus, string> = {
  draft: "Nacrt",
  done: "Završen",
};

export interface Blog {
  /** Jedinstveni ID, npr. "3f2b8c1e-..." */
  id: string;
  /** Naslov koji korisnik vidi u listi (može da se promeni) */
  title: string;
  /** Tema koja je uneta u formu pri generisanju */
  topic: string;
  /** Tekst bloga u Markdown formatu */
  content: string;
  language: Language;
  tone: Tone;
  length: Length;
  status: BlogStatus;
  /**
   * true = generisanje je prekinuto ili odsečeno, pa tekst verovatno nije potpun.
   * Oznaka nestaje kada korisnik sačuva blog sa statusom "Završen".
   */
  unfinished: boolean;
  /** Broj reči — računa se automatski pri svakom čuvanju */
  wordCount: number;
  /** Datumi u ISO formatu, npr. "2026-11-11T16:52:00.000Z" */
  createdAt: string;
  updatedAt: string;
  /** Da li je tekst napisao AI model ili demo šablon */
  source: Mode;
}

/** Podaci potrebni za novi blog. ID, datume i broj reči dodaje sloj za podatke. */
export type NewBlog = Omit<Blog, "id" | "wordCount" | "createdAt" | "updatedAt">;

/** Polja koja korisnik može da menja kod postojećeg bloga. */
export type BlogChanges = Partial<Pick<Blog, "title" | "content" | "status" | "unfinished">>;

export type StorageErrorCode =
  | "UNAVAILABLE" // browser ne dozvoljava localStorage (npr. blokirani kolačići)
  | "QUOTA" // nema više mesta
  | "CORRUPTED" // sačuvani podaci su oštećeni, a rezervna kopija nije uspela
  | "NOT_FOUND" // blog ne postoji (npr. obrisan u drugom tabu)
  | "CONFLICT"; // blog je u međuvremenu izmenjen u drugom tabu

export class StorageError extends Error {
  code: StorageErrorCode;
  constructor(code: StorageErrorCode, message: string) {
    super(message);
    this.name = "StorageError";
    this.code = code;
  }
}

/** Pretvara bilo koju grešku u poruku koju korisnik razume. */
export function storageErrorMessage(error: unknown): string {
  if (error instanceof StorageError) return error.message;
  return "Čuvanje nije uspelo zbog neočekivane greške. Tekst je i dalje u editoru — pokušaj ponovo.";
}
