import type { ComponentType } from "react";

/** Kartica sa jednim brojem na Dashboard-u (npr. "Ukupno blogova: 12"). */
export default function DashboardStatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
}: {
  label: string;
  /** null = podatak nije dostupan (npr. greška pri učitavanju) */
  value: number | null;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {loading ? (
        <div className="mt-3 h-8 w-16 animate-pulse rounded-md bg-slate-100" aria-label="Učitavanje" />
      ) : (
        <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-900">
          {value === null ? "—" : value.toLocaleString("sr-Latn-RS")}
        </p>
      )}
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
