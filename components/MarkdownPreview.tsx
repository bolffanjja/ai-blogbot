// Bezbedan prikaz Markdown-a, bez dodatnih biblioteka.
// Tekst se prvo pretvara u blokove (lib/markdown.ts), a zatim u React elemente.
// React sam "čisti" sav tekst, pa HTML iz modela nikad ne može da se izvrši.

import type { ReactNode } from "react";
import { parseInline, parseMarkdown, type Block, type Inline } from "@/lib/markdown";

function renderInline(nodes: Inline[]): ReactNode[] {
  return nodes.map((node, i) => {
    switch (node.type) {
      case "strong":
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {renderInline(node.children)}
          </strong>
        );
      case "em":
        return <em key={i}>{renderInline(node.children)}</em>;
      case "code":
        return (
          <code key={i} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em] text-slate-800">
            {node.text}
          </code>
        );
      default:
        return node.text;
    }
  });
}

const inline = (text: string) => renderInline(parseInline(text));

function renderBlock(block: Block, key: number): ReactNode {
  switch (block.type) {
    case "heading":
      if (block.level === 1)
        return (
          <h1 key={key} className="mb-5 text-3xl font-bold leading-tight text-slate-900">
            {inline(block.text)}
          </h1>
        );
      if (block.level === 2)
        return (
          <h2 key={key} className="mb-3 mt-8 text-xl font-semibold text-slate-900">
            {inline(block.text)}
          </h2>
        );
      if (block.level === 3)
        return (
          <h3 key={key} className="mb-2 mt-6 text-lg font-semibold text-slate-900">
            {inline(block.text)}
          </h3>
        );
      return (
        <h4 key={key} className="mb-2 mt-5 font-semibold text-slate-900">
          {inline(block.text)}
        </h4>
      );
    case "list": {
      const items = block.items.map((item, j) => <li key={j}>{inline(item)}</li>);
      return block.ordered ? (
        <ol key={key} start={block.start} className="mb-4 list-decimal space-y-1 pl-6 text-slate-700">
          {items}
        </ol>
      ) : (
        <ul key={key} className="mb-4 list-disc space-y-1 pl-6 text-slate-700">
          {items}
        </ul>
      );
    }
    case "quote":
      return (
        <blockquote key={key} className="mb-4 border-l-4 border-slate-200 pl-4 italic text-slate-600">
          {inline(block.text)}
        </blockquote>
      );
    case "code":
      return (
        <pre key={key} className="mb-4 overflow-x-auto rounded-lg bg-slate-100 p-3 font-mono text-sm text-slate-800">
          {block.text}
        </pre>
      );
    case "hr":
      return <hr key={key} className="my-6 border-slate-200" />;
    default:
      return (
        <p key={key} className="mb-4 leading-7 text-slate-700">
          {inline(block.text)}
        </p>
      );
  }
}

export default function MarkdownPreview({ content }: { content: string }) {
  return <article className="mx-auto max-w-2xl">{parseMarkdown(content).map(renderBlock)}</article>;
}
