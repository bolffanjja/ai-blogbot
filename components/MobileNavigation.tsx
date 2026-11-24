"use client";

// Navigacija za telefone i manje ekrane (ispod 1024 px):
// gornja traka sa dugmetom "Meni" i bočni panel koji se otvara preko sadržaja.
//
// Panel je ugrađeni HTML <dialog>, pa browser sam obezbeđuje:
// - da fokus tastature ostane unutar menija dok je otvoren,
// - zatvaranje tasterom Escape,
// - vraćanje fokusa na dugme "Meni" posle zatvaranja.

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import BrandLogo from "./BrandLogo";
import NavLinks from "./NavLinks";
import { IconClose, IconMenu } from "./icons";

export default function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  // Otvaranje/zatvaranje prozora prati stanje "open"
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    // Dok je meni otvoren, stranica ispod se ne pomera
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  // Posle prelaska na drugu stranicu meni se zatvara
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <BrandLogo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Otvori meni"
          aria-expanded={open}
          aria-controls="mobilni-meni"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <IconMenu className="h-6 w-6" />
        </button>
      </div>

      <dialog
        id="mobilni-meni"
        ref={dialogRef}
        aria-label="Glavni meni"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // Klik na zatamnjeni deo pored menija ga zatvara
          if (event.target === event.currentTarget) setOpen(false);
        }}
        onClickCapture={(event) => {
          // Klik na bilo koji link u meniju zatvara meni
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className="m-0 h-dvh max-h-none w-72 max-w-[85vw] bg-white p-0 shadow-xl backdrop:bg-slate-900/40 lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <BrandLogo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Zatvori meni"
              autoFocus
              className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <IconClose className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <NavLinks large />
          </div>

          <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">
            <p className="font-medium text-slate-700">MVP 2.0</p>
            <p>Lokalni AI · Ollama</p>
          </div>
        </div>
      </dialog>
    </>
  );
}
