/** Logo "AI BlogBot" (znak + naziv). */
export default function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-base font-bold text-white"
      >
        B
      </div>
      <div className="leading-tight">
        <p className="font-semibold text-slate-900">AI BlogBot</p>
        <p className="text-xs text-slate-500">Pisanje uz lokalni AI</p>
      </div>
    </div>
  );
}
