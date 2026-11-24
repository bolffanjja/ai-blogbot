// Čuvanje blogova u localStorage-u browsera.
//
// VAŽNO: localStorage NIJE baza za produkciju.
// - Podaci postoje samo u ovom browseru, na ovom računaru.
// - Brisanjem podataka browsera brišu se i blogovi.
// - Prostor je ograničen (obično ~5 MB, što je nekoliko stotina blogova).
// Zato je sve što zavisi od localStorage-a u ovom fajlu, a ostatak aplikacije
// koristi samo interfejs BlogRepository (repository.ts).

import { countWords, extractTitle } from "../text";
import type { BlogRepository, LoadResult, UpdateOptions } from "./repository";
import { StorageError, type Blog, type BlogChanges, type NewBlog } from "./types";

export const STORAGE_KEY = "ai-blogbot.blogs.v1";
export const BACKUP_PREFIX = "ai-blogbot.blogs.backup.";
const DATA_VERSION = 1;

const LANGUAGES = ["sr", "en", "de"];
const TONES = ["professional", "casual", "inspirational", "educational"];
const LENGTHS = ["short", "medium", "long"];

/** Samo ono što nam treba od localStorage-a (lakše za testiranje). */
export type SimpleStorage = Pick<Storage, "getItem" | "setItem" | "key" | "length">;

interface StoredData {
  version: number;
  blogs: unknown[];
}

/** Stanje pročitano iz memorije browsera. */
interface ReadState {
  blogs: Blog[];
  /** Zapisi koje ne umemo da pročitamo. Čuvamo ih netaknute, nikad ih ne brišemo. */
  unreadable: unknown[];
  warning: string | null;
  /** false = ne smemo da pišemo, jer bismo mogli da prepišemo podatke koje ne razumemo */
  writable: boolean;
  blockedReason: string | null;
}

// ---------- pristup browseru ----------

function browserStorage(): SimpleStorage {
  if (typeof window === "undefined") {
    throw new StorageError("UNAVAILABLE", "Blogovi mogu da se čitaju samo u browseru.");
  }
  try {
    return window.localStorage;
  } catch {
    throw new StorageError(
      "UNAVAILABLE",
      "Browser ne dozvoljava čuvanje podataka. Proveri da nisi u privatnom režimu i da kolačići nisu blokirani.",
    );
  }
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22 ||
      error.code === 1014)
  );
}

function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------- provera zapisa ----------

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validDate(value: unknown): string | null {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}

function oneOf<T extends string>(value: unknown, allowed: string[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value) ? (value as T) : fallback;
}

/**
 * Pretvara sačuvani zapis u Blog. Ako nedostaje nešto nevažno (npr. ton),
 * stavlja podrazumevanu vrednost. Ako nema ID-ja ili teksta, vraća null.
 */
export function normalizeBlog(raw: unknown): Blog | null {
  if (!isObject(raw)) return null;
  if (typeof raw.id !== "string" || !raw.id) return null;
  if (typeof raw.content !== "string") return null;

  const content = raw.content;
  const topic = typeof raw.topic === "string" ? raw.topic : "";
  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim()
      : (extractTitle(content) ?? (topic || "Bez naslova"));
  const createdAt = validDate(raw.createdAt) ?? validDate(raw.updatedAt) ?? new Date(0).toISOString();
  const updatedAt = validDate(raw.updatedAt) ?? createdAt;

  return {
    id: raw.id,
    title,
    topic,
    content,
    language: oneOf(raw.language, LANGUAGES, "sr"),
    tone: oneOf(raw.tone, TONES, "professional"),
    length: oneOf(raw.length, LENGTHS, "medium"),
    status: oneOf(raw.status, ["draft", "done"], "draft"),
    // Stariji zapisi nemaju ovo polje — tada je false
    unfinished: raw.unfinished === true,
    wordCount: countWords(content),
    createdAt,
    updatedAt,
    source: oneOf(raw.source, ["ai", "demo"], "ai"),
  };
}

// ---------- glavni deo ----------

export function createLocalStorageRepository(
  getStorage: () => SimpleStorage = browserStorage,
  now: () => Date = () => new Date(),
): BlogRepository {
  const listeners = new Set<() => void>();
  let removeStorageEvent: (() => void) | null = null;

  function notify() {
    listeners.forEach((listener) => listener());
  }

  /** Oštećene podatke prvo kopiramo u rezervni ključ, da se ništa ne izgubi. */
  function backupCorrupted(storage: SimpleStorage, raw: string, reason: string): ReadState {
    // Ako ista rezervna kopija već postoji, ne pravimo novu
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(BACKUP_PREFIX) && storage.getItem(key) === raw) {
        return corruptedState(key);
      }
    }
    const backupKey = `${BACKUP_PREFIX}${now().getTime()}`;
    try {
      storage.setItem(backupKey, raw);
      return corruptedState(backupKey);
    } catch {
      const message =
        `${reason} Nije uspelo pravljenje rezervne kopije, pa je čuvanje isključeno ` +
        "da se stari podaci ne bi prepisali.";
      return { blogs: [], unreadable: [], warning: message, writable: false, blockedReason: message };
    }
  }

  function corruptedState(backupKey: string): ReadState {
    return {
      blogs: [],
      unreadable: [],
      warning:
        `Ranije sačuvani podaci nisu mogli da se pročitaju. Nisu obrisani — kopija je sačuvana ` +
        `u browseru pod ključem „${backupKey}“.`,
      writable: true,
      blockedReason: null,
    };
  }

  function read(storage: SimpleStorage): ReadState {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) {
      return { blogs: [], unreadable: [], warning: null, writable: true, blockedReason: null };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return backupCorrupted(storage, raw, "Sačuvani podaci su oštećeni.");
    }
    if (!isObject(parsed) || !Array.isArray(parsed.blogs)) {
      return backupCorrupted(storage, raw, "Sačuvani podaci imaju nepoznat oblik.");
    }
    if (typeof parsed.version === "number" && parsed.version > DATA_VERSION) {
      const message =
        "Blogovi su sačuvani novijom verzijom aplikacije. Možeš da ih čitaš, ali je čuvanje " +
        "isključeno da se podaci ne bi oštetili.";
      const blogs = parsed.blogs.map(normalizeBlog).filter((b): b is Blog => b !== null);
      return { blogs, unreadable: [], warning: message, writable: false, blockedReason: message };
    }

    const blogs: Blog[] = [];
    const unreadable: unknown[] = [];
    const seenIds = new Set<string>();
    for (const item of parsed.blogs) {
      const blog = normalizeBlog(item);
      if (blog && !seenIds.has(blog.id)) {
        seenIds.add(blog.id);
        blogs.push(blog);
      } else {
        unreadable.push(item);
      }
    }

    return {
      blogs,
      unreadable,
      warning:
        unreadable.length > 0
          ? `${unreadable.length} sačuvan${unreadable.length === 1 ? " zapis nije mogao" : "ih zapisa nije moglo"} da se pročita. Ti zapisi nisu obrisani.`
          : null,
      writable: true,
      blockedReason: null,
    };
  }

  function write(storage: SimpleStorage, state: ReadState, blogs: Blog[]) {
    if (!state.writable) {
      throw new StorageError("CORRUPTED", state.blockedReason ?? "Čuvanje trenutno nije moguće.");
    }
    const data: StoredData = { version: DATA_VERSION, blogs: [...blogs, ...state.unreadable] };
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      if (isQuotaError(error)) {
        throw new StorageError(
          "QUOTA",
          "Nema više mesta za čuvanje u browseru. Obriši neke stare blogove ili preuzmi ih kao .md pa ih obriši.",
        );
      }
      throw new StorageError("UNAVAILABLE", "Browser nije dozvolio čuvanje. Tekst je i dalje u editoru — pokušaj ponovo.");
    }
    notify();
  }

  return {
    async list(): Promise<LoadResult> {
      const state = read(getStorage());
      return { blogs: state.blogs, warning: state.warning };
    },

    async get(id) {
      return read(getStorage()).blogs.find((b) => b.id === id) ?? null;
    },

    async create(input: NewBlog) {
      const storage = getStorage();
      const state = read(storage);
      const timestamp = now().toISOString();
      let id = newId();
      while (state.blogs.some((b) => b.id === id)) id = newId();

      const blog: Blog = {
        ...input,
        id,
        title: input.title.trim() || extractTitle(input.content) || input.topic || "Bez naslova",
        wordCount: countWords(input.content),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      write(storage, state, [blog, ...state.blogs]);
      return blog;
    },

    async update(id: string, changes: BlogChanges, options: UpdateOptions = {}) {
      const storage = getStorage();
      const state = read(storage);
      const index = state.blogs.findIndex((b) => b.id === id);
      if (index === -1) {
        throw new StorageError(
          "NOT_FOUND",
          "Ovaj blog više ne postoji (možda je obrisan u drugom tabu). Tekst je i dalje u editoru — možeš da ga kopiraš.",
        );
      }
      const current = state.blogs[index];
      if (options.expectedUpdatedAt && current.updatedAt !== options.expectedUpdatedAt) {
        throw new StorageError("CONFLICT", "Ovaj blog je u međuvremenu izmenjen u drugom tabu ili prozoru.");
      }

      const content = changes.content ?? current.content;
      const title = changes.title !== undefined ? changes.title.trim() || current.title : current.title;
      const status = changes.status ?? current.status;
      const updated: Blog = {
        ...current,
        title,
        content,
        status,
        // Kada korisnik označi blog kao završen, više nije "nedovršen"
        // (a kada nastavak generisanja uspe, generator šalje unfinished: false)
        unfinished: status === "done" ? false : (changes.unfinished ?? current.unfinished),
        wordCount: countWords(content),
        updatedAt: now().toISOString(),
      };
      const blogs = [...state.blogs];
      blogs[index] = updated;
      write(storage, state, blogs);
      return updated;
    },

    async remove(id: string) {
      const storage = getStorage();
      const state = read(storage);
      if (!state.blogs.some((b) => b.id === id)) return;
      write(
        storage,
        state,
        state.blogs.filter((b) => b.id !== id),
      );
    },

    subscribe(listener) {
      listeners.add(listener);
      // Promene iz drugih tabova stižu preko "storage" događaja
      if (!removeStorageEvent && typeof window !== "undefined") {
        const onStorage = (event: StorageEvent) => {
          if (event.key === STORAGE_KEY || event.key === null) notify();
        };
        window.addEventListener("storage", onStorage);
        removeStorageEvent = () => window.removeEventListener("storage", onStorage);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && removeStorageEvent) {
          removeStorageEvent();
          removeStorageEvent = null;
        }
      };
    },
  };
}
