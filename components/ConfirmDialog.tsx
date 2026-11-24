"use client";

// Prozor za potvrdu (npr. "Da li sigurno želiš da obrišeš blog?").
// Koristi ugrađeni HTML <dialog>, pa ne treba nijedna dodatna biblioteka.

import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Tekst dugmeta za odustajanje (podrazumevano "Otkaži") */
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Crveno dugme za opasne radnje (brisanje) */
  danger?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Otkaži",
  onConfirm,
  onCancel,
  danger,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        // Taster Esc
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        // Klik van prozora (na zatamnjenu pozadinu) zatvara ga
        if (event.target === event.currentTarget) onCancel();
      }}
      className="m-auto w-[min(92vw,420px)] rounded-2xl p-0 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            autoFocus // sigurniji izbor je podrazumevan (Enter ne briše i ne prekida slučajno)
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
