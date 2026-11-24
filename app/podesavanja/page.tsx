import PageHeader from "@/components/PageHeader";

// Privremena stranica. Sadržaj (status AI modela, podaci, o aplikaciji) pravi se u koraku F3.3.

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Podešavanja" subtitle="AI model, podaci i informacije o aplikaciji" />
      <div className="p-6 lg:p-10">
        <p className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Ova stranica se pravi u koraku F3.3.
        </p>
      </div>
    </>
  );
}
