import type { ReactNode } from "react";

/** Zaglavlje na vrhu svake stranice: naslov, podnaslov i (opciono) nešto desno. */
export default function PageHeader({
  title,
  subtitle,
  description,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Kratak opis ispod podnaslova (opciono) */
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur lg:px-10">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </header>
  );
}
