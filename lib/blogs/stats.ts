// Statistika za Dashboard. Računa se iz stvarnih sačuvanih blogova — nema izmišljenih brojeva.
// Čiste funkcije (bez React-a i bez localStorage-a), pa je lako testirati.

import type { Blog } from "./types";

export interface BlogStats {
  total: number;
  /** Kreirani od ponedeljka u 00:00 (lokalno vreme browsera) */
  thisWeek: number;
  drafts: number;
  totalWords: number;
}

/** Ponedeljak tekuće nedelje u 00:00, po lokalnom vremenu. */
export function startOfWeek(now: Date): Date {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSinceMonday = (start.getDay() + 6) % 7; // nedelja = 6, ponedeljak = 0
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

export function computeStats(blogs: Blog[], now: Date = new Date()): BlogStats {
  const weekStart = startOfWeek(now).getTime();
  return {
    total: blogs.length,
    thisWeek: blogs.filter((b) => Date.parse(b.createdAt) >= weekStart).length,
    drafts: blogs.filter((b) => b.status === "draft").length,
    totalWords: blogs.reduce((sum, b) => sum + b.wordCount, 0),
  };
}

const byUpdatedDesc = (a: Blog, b: Blog) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0);

/** Poslednje izmenjeni blogovi (najnoviji prvi). */
export function recentlyUpdated(blogs: Blog[], count = 5): Blog[] {
  return [...blogs].sort(byUpdatedDesc).slice(0, count);
}

/** Poslednje izmenjeni nacrt, ili null ako nacrta nema. */
export function latestDraft(blogs: Blog[]): Blog | null {
  return [...blogs].filter((b) => b.status === "draft").sort(byUpdatedDesc)[0] ?? null;
}
