"use client";

import { usePathname } from "next/navigation";
import GuardedLink from "./GuardedLink";

const NAV = [
  { label: "Generator", icon: "✨", href: "/" },
  { label: "Moji blogovi", icon: "📄", href: "/blogovi" },
  { label: "Šabloni", icon: "🧩", soon: true },
  { label: "Podešavanja", icon: "⚙️", soon: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 text-lg font-bold text-white shadow-md">
          B
        </div>
        <div>
          <p className="font-semibold text-slate-900">AI BlogBot</p>
          <p className="text-xs text-slate-500">Pisanje uz AI</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          if (!item.href) {
            return (
              <span
                key={item.label}
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                <span>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                  uskoro
                </span>
              </span>
            );
          }
          // "/blogovi" je aktivan i kada je otvoren pojedinačni blog "/blogovi/..."
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <GuardedLink
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
            </GuardedLink>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 p-4 text-white">
        <p className="text-sm font-semibold">Lokalni AI</p>
        <p className="mt-1 text-xs text-indigo-100">
          Blogove piše model preko Ollame, na tvom računaru. Besplatno i bez slanja podataka na internet.
        </p>
      </div>
    </aside>
  );
}
