// Bočni meni za veće ekrane (od 1024 px). Na telefonu ga zamenjuje MobileNavigation.

import BrandLogo from "./BrandLogo";
import NavLinks from "./NavLinks";

export default function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="px-5 py-6">
        <BrandLogo />
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <NavLinks />
      </div>

      <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
        <p className="font-medium text-slate-700">MVP 2.0</p>
        <p>Lokalni AI · Ollama</p>
      </div>
    </aside>
  );
}
