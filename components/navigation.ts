// Stavke glavnog menija. Koriste ih i AppSidebar (računar) i MobileNavigation (telefon),
// pa se meni menja na jednom mestu.

import { IconDashboard, IconDocuments, IconPen, IconSettings } from "./icons";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: IconDashboard },
  { label: "Novi blog", href: "/novi-blog", icon: IconPen },
  { label: "Moji blogovi", href: "/blogovi", icon: IconDocuments },
  { label: "Podešavanja", href: "/podesavanja", icon: IconSettings },
];

/** Da li je stavka menija aktivna za trenutnu adresu. "/blogovi" je aktivan i za "/blogovi/123". */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
