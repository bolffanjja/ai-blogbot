// Zaštita od slučajnog gubitka rada.
// - Pri zatvaranju ili osvežavanju taba browser pita "Napusti stranicu?" (njegov ugrađeni prozor;
//   tekst tog prozora browser ne dozvoljava da menjamo).
// - Pri kliku na link u aplikaciji (Sidebar, "Nazad", "Otvori") prvo pitamo:
//     • ako generisanje traje → stranica prikazuje svoj prozor "Ostani / Prekini i napusti";
//     • ako postoje nesačuvane izmene → pitanje da li da ih odbacimo.
// Napomena: dugme "Nazad" u samom browseru ne možemo pouzdano da presretnemo u Next.js-u.

import { useEffect } from "react";

const MESSAGE = "Imaš nesačuvane izmene. Ako nastaviš, biće izgubljene. Da li želiš da nastaviš?";

let hasUnsavedChanges = false;

/**
 * Funkcija koju stranica registruje dok radi nešto što ne sme da se prekine (npr. generisanje).
 * Dobija adresu na koju korisnik želi da ode i sama odlučuje šta dalje (npr. prikaže prozor).
 */
type NavigationBlocker = (href: string) => void;
let blocker: NavigationBlocker | null = null;

/** Vraća true ako sme da se nastavi (nema izmena ili je korisnik potvrdio). */
export function confirmDiscardChanges(): boolean {
  if (!hasUnsavedChanges) return true;
  const ok = window.confirm(MESSAGE);
  if (ok) hasUnsavedChanges = false;
  return ok;
}

/**
 * Poziva se pre prelaska na drugu stranicu unutar aplikacije.
 * Vraća true ako prelazak sme odmah da se desi.
 */
export function requestNavigation(href: string): boolean {
  if (blocker) {
    blocker(href);
    return false;
  }
  return confirmDiscardChanges();
}

/** Browser pita pre zatvaranja/osvežavanja taba dok je `active` true. */
function useBeforeUnload(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ""; // potrebno za starije browsere
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active]);
}

/** Komponenta javlja da li trenutno ima nesačuvane izmene. */
export function useUnsavedChangesWarning(unsaved: boolean) {
  useBeforeUnload(unsaved);
  useEffect(() => {
    if (!unsaved) return;
    hasUnsavedChanges = true;
    return () => {
      hasUnsavedChanges = false;
    };
  }, [unsaved]);
}

/**
 * Dok je `onBlocked` zadat, linkovi u aplikaciji ne vode odmah na drugu stranicu,
 * već pozivaju `onBlocked(href)`. Zatvaranje/osvežavanje taba takođe traži potvrdu.
 */
export function useNavigationBlocker(onBlocked: NavigationBlocker | null) {
  useBeforeUnload(onBlocked !== null);
  useEffect(() => {
    if (!onBlocked) return;
    blocker = onBlocked;
    return () => {
      if (blocker === onBlocked) blocker = null;
    };
  }, [onBlocked]);
}
