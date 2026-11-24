// Mali Markdown parser, bez dodatnih biblioteka.
// Tekst čita RED PO RED i pretvara ga u listu blokova (naslov, pasus, lista...).
// Komponenta MarkdownPreview zatim te blokove prikazuje kao React elemente,
// pa se nikad ne ubacuje sirovi HTML (nema dangerouslySetInnerHTML).
//
// Podržano:
//   # / ## / ### naslovi (i #### – ######)
//   pasusi (susedni redovi se spajaju, prazan red ih razdvaja)
//   - / * / + obične liste,  1. / 1) numerisane liste
//   **bold**, __bold__, *kurziv*, _kurziv_, ***bold kurziv***, `kod`
//   > citat, --- linija, ``` blok koda ```

export type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; start: number; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; text: string }
  | { type: "hr" };

const HEADING = /^(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/;
const UNORDERED_ITEM = /^[-*+]\s+(.*)$/;
const ORDERED_ITEM = /^(\d{1,9})[.)]\s+(.*)$/;
const HR = /^(?:-\s*){3,}$|^(?:\*\s*){3,}$|^(?:_\s*){3,}$/;
const QUOTE = /^>\s?(.*)$/;
const FENCE = /^(```|~~~)/;

export function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];

  let paragraph: string[] = [];
  let list: { ordered: boolean; start: number; items: string[] } | null = null;
  let quote: string[] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    if (list) blocks.push({ type: "list", ...list });
    if (quote.length) blocks.push({ type: "quote", text: quote.join(" ") });
    paragraph = [];
    list = null;
    quote = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Prazan red završava pasus, listu ili citat
    if (!line) {
      flush();
      continue;
    }

    // Blok koda ``` ... ``` (ako zatvaranje još nije stiglo tokom streaminga, uzima se do kraja)
    if (FENCE.test(line)) {
      flush();
      const fence = line.slice(0, 3);
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) {
        code.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    // Samo "##" bez teksta: naslov koji model tek počinje da piše (streaming) — preskačemo
    if (/^#{1,6}$/.test(line)) {
      flush();
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      flush();
      if (heading[2]) {
        blocks.push({ type: "heading", level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6, text: heading[2] });
      }
      continue;
    }

    if (HR.test(line)) {
      flush();
      blocks.push({ type: "hr" });
      continue;
    }

    const unordered = line.match(UNORDERED_ITEM);
    const ordered = line.match(ORDERED_ITEM);
    if (unordered || ordered) {
      const isOrdered = !unordered;
      const text = unordered ? unordered[1] : ordered![2];
      // Nova lista počinje ako ranije nije bilo liste ili je bila druge vrste
      if (!list || list.ordered !== isOrdered) {
        flush();
        list = { ordered: isOrdered, start: ordered ? Number(ordered[1]) : 1, items: [] };
      }
      list.items.push(text);
      continue;
    }

    const quoteLine = line.match(QUOTE);
    if (quoteLine) {
      if (!quote.length) flush();
      quote.push(quoteLine[1]);
      continue;
    }

    // Običan red: nastavak stavke liste (ako je uvučen) ili deo pasusa
    if (list && /^\s+/.test(lines[i])) {
      list.items[list.items.length - 1] += ` ${line}`;
      continue;
    }
    if (list || quote.length) flush();
    paragraph.push(line);
  }

  flush();
  return blocks;
}

// ---------- formatiranje unutar reda ----------

export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] }
  | { type: "code"; text: string };

// Redosled je važan: *** pre **, ** pre *.
const INLINE_PATTERNS: { regex: RegExp; make: (m: RegExpExecArray) => Inline }[] = [
  { regex: /`([^`\n]+)`/, make: (m) => ({ type: "code", text: m[1] }) },
  {
    regex: /\*\*\*(\S(?:[^*\n]*?\S)?)\*\*\*/,
    make: (m) => ({ type: "strong", children: [{ type: "em", children: parseInline(m[1]) }] }),
  },
  { regex: /\*\*(\S(?:[^\n]*?\S)?)\*\*/, make: (m) => ({ type: "strong", children: parseInline(m[1]) }) },
  { regex: /__(\S(?:[^\n]*?\S)?)__/, make: (m) => ({ type: "strong", children: parseInline(m[1]) }) },
  { regex: /\*(\S(?:[^*\n]*?\S)?)\*/, make: (m) => ({ type: "em", children: parseInline(m[1]) }) },
  // _kurziv_ samo kao cela reč, da se ne pokvari npr. ime_fajla_v2
  {
    regex: /(?<![\p{L}\p{N}_])_(\S(?:[^_\n]*?\S)?)_(?![\p{L}\p{N}_])/u,
    make: (m) => ({ type: "em", children: parseInline(m[1]) }),
  },
];

/** Deli red teksta na običan tekst, bold, kurziv i kod. */
export function parseInline(text: string): Inline[] {
  const result: Inline[] = [];
  let rest = text;

  while (rest) {
    // Nađi oznaku koja se javlja najranije u tekstu
    let best: { index: number; match: RegExpExecArray; make: (m: RegExpExecArray) => Inline } | null = null;
    for (const pattern of INLINE_PATTERNS) {
      const match = pattern.regex.exec(rest);
      if (match && (!best || match.index < best.index)) {
        best = { index: match.index, match, make: pattern.make };
      }
    }
    if (!best) {
      result.push({ type: "text", text: rest });
      break;
    }
    if (best.index > 0) result.push({ type: "text", text: rest.slice(0, best.index) });
    result.push(best.make(best.match));
    rest = rest.slice(best.index + best.match[0].length);
  }

  return result;
}
