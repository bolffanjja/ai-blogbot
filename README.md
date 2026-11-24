# AI BlogBot

Web aplikacija za generisanje blogova pomoću **lokalnog AI modela** (Ollama), besplatno i bez slanja podataka na internet. Ima i **demo režim** (šabloni) koji radi bez AI-ja.

## Pokretanje

1. Proveri da Ollama radi: ikonica lame dole desno na traci, ili u PowerShell-u `ollama list`.
2. Preuzmi model (samo prvi put):

```bash
ollama pull qwen2.5:1.5b
```

3. U folderu projekta pokreni:

```bash
npm install
npm run dev
```

4. Otvori http://localhost:3000 (ako se ne otvori, probaj http://127.0.0.1:3000). Oznaka u gornjem desnom uglu treba da bude zelena („Ollama · qwen2.5:1.5b“).

Aplikacija je namerno dostupna samo sa tvog računara (`-H 127.0.0.1` u `package.json`), da drugi uređaji u istoj mreži ne bi mogli da pokreću AI na tvom računaru.

Za zaustavljanje servera pritisni `Ctrl + C` u terminalu.

## Provera koda

```bash
npm run typecheck   # TypeScript greške
npm run build       # da li se aplikacija uspešno sastavlja
```

## Gde se čuvaju blogovi

Svaki generisani blog se automatski čuva kao **nacrt** u sekciji „Moji blogovi“. Za sada se čuvaju u `localStorage`-u browsera:

- podaci postoje samo u tom browseru, na tom računaru;
- ako obrišeš podatke browsera (kolačiće i podatke sajtova), brišu se i blogovi;
- za važne blogove koristi „Preuzmi .md“ kao rezervnu kopiju.

Sav kod za čuvanje je u `lib/blogs/`, pa kasnije možemo da pređemo na pravu bazu bez menjanja ostatka aplikacije.

## Podešavanja (nije obavezno)

Kopiraj `.env.example` u `.env.local` i promeni naziv modela ili adresu Ollame, pa ponovo pokreni `npm run dev`.

## Kako radi

```
Pregledač (app/page.tsx)
   │  POST /api/generate  { topic, language, tone, length }
   ▼
Server (app/api/generate/route.ts)
   │  pravi prompt (lib/prompt.ts) i šalje ga Ollami
   ▼
Ollama  http://127.0.0.1:11434/api/chat
   │  vraća tekst deo po deo
   ▼
Server prosleđuje tekst → pregledač ga prikazuje postepeno (lib/aiClient.ts)
```

## Struktura

```
app/
  layout.tsx                  zajednički okvir (meni levo / gore na telefonu)
  page.tsx                    Dashboard (početna)
  novi-blog/page.tsx          generator blogova
  podesavanja/page.tsx        Podešavanja
  blogovi/page.tsx            Moji blogovi: lista, pretraga, filteri
  blogovi/[id]/page.tsx       otvaranje i uređivanje jednog bloga
  api/generate/route.ts       šalje zahtev Ollami i vraća tekst postepeno
  api/ollama-status/route.ts  proverava da li Ollama radi i da li je model preuzet
components/
  AppSidebar.tsx              meni za računar
  MobileNavigation.tsx        meni za telefon (bočni panel)
  NavLinks.tsx, navigation.ts stavke menija (zajedničke za oba menija)
  icons.tsx, BrandLogo.tsx    SVG ikonice i logo
  GeneratorForm.tsx           tema, režim, jezik, ton, dužina, Generiši/Prekini
  BlogEditor.tsx              pregled/uređivanje, kopiranje, preuzimanje, čuvanje
  ConfirmDialog.tsx           prozor za potvrdu (brisanje)
  GuardedLink.tsx             link koji pita ako ima nesačuvanih izmena
  PageHeader.tsx, StatusBadge.tsx
  OllamaStatus.tsx            zelena/crvena oznaka u zaglavlju
  ErrorAlert.tsx              poruke o greškama sa uputstvom
  MarkdownPreview.tsx
lib/
  blogs/                      čuvanje blogova (tip, localStorage, pretraga, hook)
  text.ts                     broj reči, naslov, ime fajla, datumi
  unsavedChanges.ts           upozorenje pre gubitka izmena
  prompt.ts                   uputstvo za model + provera unosa
  ollama.ts                   veza sa Ollamom (server)
  aiClient.ts                 čitanje teksta u pregledaču
  demoGenerator.ts            demo režim (šabloni)
  options.ts                  jezici, tonovi, dužine, režimi
```

## Česti problemi

| Poruka | Rešenje |
|---|---|
| Ollama nije pokrenuta | Pokreni aplikaciju Ollama iz Start menija ili `ollama serve` |
| Model nije preuzet | `ollama pull qwen2.5:1.5b` |
| Generisanje traje dugo | Normalno na slabijem procesoru: 1–3 min. Prvi blog je najsporiji jer se model učitava. |
