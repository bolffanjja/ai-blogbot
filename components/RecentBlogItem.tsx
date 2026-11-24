import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { IconArrowRight } from "./icons";
import type { Blog } from "@/lib/blogs";
import { LANGUAGES } from "@/lib/options";
import { formatDate } from "@/lib/text";

/** Jedan red u listi "Poslednji blogovi". Ceo red je link ka blogu. */
export default function RecentBlogItem({ blog }: { blog: Blog }) {
  const language = LANGUAGES.find((l) => l.value === blog.language)?.label ?? blog.language;

  return (
    <li>
      <Link
        href={`/blogovi/${blog.id}`}
        className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900 group-hover:text-brand-700">{blog.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span>Izmenjen {formatDate(blog.updatedAt)}</span>
            <span aria-hidden="true">·</span>
            <span>{language}</span>
            <span aria-hidden="true">·</span>
            <span>{blog.wordCount.toLocaleString("sr-Latn-RS")} reči</span>
            {/* Na telefonu status ide u ovaj red, na većem ekranu desno */}
            <span className="sm:hidden">
              <StatusBadge status={blog.status} unfinished={blog.unfinished} />
            </span>
          </div>
        </div>
        <div className="hidden shrink-0 sm:block">
          <StatusBadge status={blog.status} unfinished={blog.unfinished} />
        </div>
        <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-600">
          <span className="hidden sm:inline">Otvori</span>
          <IconArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </li>
  );
}
