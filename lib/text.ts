// Pomoćne funkcije za rad sa tekstom bloga.
// Ne zavise od React-a ni od browsera, pa mogu da se koriste svuda (i u testovima).

/** Broji reči u Markdown tekstu (oznake #, *, - se ne računaju kao reči). */
export function countWords(text: string): number {
  return text
    .replace(/^\s*#{1,6}\s/gm, " ") // # naslovi
    .replace(/^\s*[-*]\s/gm, " ") // - stavke liste
    .replace(/[*_`]/g, " ") // **bold**, _kurziv_, `kod`
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/** Procena vremena čitanja u minutima (prosečno ~200 reči u minuti). */
export function readingMinutes(words: number): number {
  if (words <= 0) return 0;
  return Math.max(1, Math.round(words / 200));
}

/** Naslov iz prvog reda koji počinje sa "# ". Vraća null ako ga nema. */
export function extractTitle(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  const title = match?.[1].replace(/[*_`]/g, "").trim();
  return title ? title : null;
}

/** Pretvara tekst u ime fajla: "Zdrava ishrana!" -> "zdrava-ishrana". */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/đ/g, "dj")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "blog"
  );
}

/**
 * Priprema tekst za pretragu: mala slova, bez kvačica.
 * Tako pretraga "cevapi" pronalazi i "Ćevapi".
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

const dateFormatter = new Intl.DateTimeFormat("sr-Latn-RS", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("sr-Latn-RS", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** "11. nov 2026." */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

/** "11. nov 2026. 17:52" */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}
