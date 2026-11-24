import { STATUS_LABELS, type BlogStatus } from "@/lib/blogs";

const STYLES: Record<BlogStatus, string> = {
  draft: "bg-amber-50 text-amber-700 ring-amber-200",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export default function StatusBadge({ status, unfinished }: { status: BlogStatus; unfinished?: boolean }) {
  return (
    <>
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STYLES[status]}`}>
        {STATUS_LABELS[status]}
      </span>
      {unfinished && (
        <span
          title="Generisanje je prekinuto, tekst verovatno nije potpun"
          className="ml-1 inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 ring-1 ring-orange-200"
        >
          Nedovršen
        </span>
      )}
    </>
  );
}
