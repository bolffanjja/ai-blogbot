"use client";

// Lista linkova glavnog menija. Svaki link prolazi kroz GuardedLink,
// pa zaštita tokom generisanja i nesačuvanih izmena radi i u meniju.

import { usePathname } from "next/navigation";
import GuardedLink from "./GuardedLink";
import { NAV_ITEMS, isNavItemActive } from "./navigation";

export default function NavLinks({ large = false }: { large?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Glavni meni">
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <GuardedLink
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  large ? "py-3 text-base" : "py-2.5 text-sm"
                } ${active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-brand-600" : "text-slate-400"}`} />
                {item.label}
              </GuardedLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
