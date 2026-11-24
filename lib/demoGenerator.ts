// DEMO generator: pravi blog od unapred pripremljenih šablona, bez ikakvog API-ja.
// Kasnije ćemo samo zameniti funkciju generateBlog() pozivom ka pravom AI modelu,
// a ostatak aplikacije ostaje isti.

import type { BlogOptions, Language, Length, Tone } from "./options";

interface Section {
  heading: string;
  paragraphs: [string, string];
  bullets: string[];
}

interface LanguagePack {
  titles: Record<Tone, string[]>;
  intro: Record<Tone, string>;
  leads: Record<Tone, string[]>;
  sections: Section[];
  conclusionHeading: string;
  conclusion: Record<Tone, string>;
}

const T = "{topic}";

const sr: LanguagePack = {
  titles: {
    professional: [`${T}: kompletan vodič za 2026.`, `Sve što treba da znate o temi „${T}“`],
    casual: [`Hajde da pričamo o temi „${T}“`, `${T} – bez komplikovanja`],
    inspirational: [`Kako vas tema „${T}“ može promeniti`, `${T}: vaš prvi korak ka nečem većem`],
    educational: [`${T} objašnjeno korak po korak`, `Uvod u temu „${T}“ za početnike`],
  },
  intro: {
    professional: `Tema „${T}“ sve češće se nalazi u fokusu stručnjaka i kompanija. U ovom tekstu dajemo pregled ključnih pojmova, prednosti i praktičnih preporuka kako biste doneli informisane odluke.`,
    casual: `Verovatno ste već čuli za temu „${T}“, ali niste sigurni odakle da krenete? Ništa strašno – skuvajte kafu, pa da prođemo kroz sve najvažnije, polako i bez stresa.`,
    inspirational: `Svaka velika promena počinje jednom idejom. Za mnoge ljude upravo je tema „${T}“ bila ta iskra koja ih je pokrenula. Možda je sada vaš red.`,
    educational: `U ovom vodiču objasnićemo temu „${T}“ od samih osnova. Na kraju ćete razumeti ključne pojmove, znati kako da počnete i koje greške da izbegnete.`,
  },
  leads: {
    professional: ["Analize pokazuju da", "Iz poslovne perspektive,", "Prema iskustvu iz prakse,"],
    casual: ["Iskreno,", "Evo u čemu je fora:", "Da budemo realni,"],
    inspirational: ["Zamislite trenutak kada", "Najlepše od svega je to što", "Ne zaboravite da"],
    educational: ["Važno je razumeti da", "Prvo, zapamtite da", "Pojednostavljeno rečeno,"],
  },
  sections: [
    {
      heading: `Šta zapravo podrazumeva tema „${T}“`,
      paragraphs: [
        `ova oblast obuhvata skup ideja, alata i navika koje zajedno daju konkretne rezultate. Nije reč o trendu koji prolazi, već o pristupu koji se razvija godinama.`,
        `Mnogi ljudi greše kada misle da je potrebno mnogo predznanja. U stvarnosti, dovoljno je razumeti nekoliko osnovnih principa i dosledno ih primenjivati.`,
      ],
      bullets: ["Jasno definisan cilj", "Osnovno razumevanje pojmova", "Spremnost na učenje"],
    },
    {
      heading: "Glavne prednosti",
      paragraphs: [
        `oni koji se ozbiljno posvete temi „${T}“ najčešće primećuju uštedu vremena, bolju organizaciju i veće samopouzdanje u radu.`,
        `Pored toga, prednosti se vremenom sabiraju. Male promene koje danas uvedete za nekoliko meseci mogu doneti primetan napredak.`,
      ],
      bullets: ["Ušteda vremena", "Bolji rezultati", "Veća motivacija"],
    },
    {
      heading: "Najčešće greške koje treba izbegavati",
      paragraphs: [
        `najveća greška je pokušaj da se sve uradi odjednom. Bolje je krenuti od jednog malog koraka i graditi postepeno.`,
        `Druga česta greška je oslanjanje na neproverene savete. Uvek proverite izvore i prilagodite preporuke svojoj situaciji.`,
      ],
      bullets: ["Previše ciljeva odjednom", "Nedostatak doslednosti", "Poređenje sa drugima"],
    },
    {
      heading: "Praktični saveti za početak",
      paragraphs: [
        `najbolji početak je jednostavan plan: odredite šta želite da postignete, koliko vremena imate i kako ćete meriti napredak.`,
        `Zapisujte šta ste naučili i redovno se vraćajte na beleške. Tako ćete brže uočiti šta funkcioniše, a šta ne.`,
      ],
      bullets: ["Napravite nedeljni plan", "Pratite napredak", "Tražite povratne informacije"],
    },
    {
      heading: "Primeri iz prakse",
      paragraphs: [
        `brojni pojedinci i mali timovi već su uspešno primenili ove ideje. Zajedničko im je to što su krenuli skromno i ostali uporni.`,
        `Jedan od najčešćih primera je mala firma koja je uvođenjem jednostavnih promena za nekoliko meseci znatno poboljšala svoje rezultate.`,
      ],
      bullets: ["Mali koraci, veliki efekat", "Učenje na greškama", "Deljenje znanja sa timom"],
    },
    {
      heading: "Šta nas čeka u budućnosti",
      paragraphs: [
        `razvoj tehnologije i novih alata učiniće temu „${T}“ još dostupnijom. Ono što je danas napredno, sutra će biti standard.`,
        `Zato je sada pravi trenutak da steknete osnovno znanje i budete korak ispred ostalih.`,
      ],
      bullets: ["Više automatizacije", "Pristupačniji alati", "Veća potražnja za znanjem"],
    },
  ],
  conclusionHeading: "Zaključak",
  conclusion: {
    professional: `Tema „${T}“ nudi jasne i merljive prednosti onima koji joj pristupe sistematično. Preporučujemo da započnete pilot-korakom i rezultate pratite kroz konkretne pokazatelje.`,
    casual: `Eto, nije bilo tako strašno! Krenite polako, isprobajte nešto od ovoga već ove nedelje i javite kako je prošlo.`,
    inspirational: `Ne čekajte savršen trenutak – on ne postoji. Napravite prvi korak danas, i za godinu dana bićete zahvalni sebi što ste počeli.`,
    educational: `Sada znate osnove, prednosti, česte greške i praktične korake. Sledeći zadatak: izaberite jedan savet iz ovog teksta i primenite ga tokom naredne nedelje.`,
  },
};

const en: LanguagePack = {
  titles: {
    professional: [`${T}: The Complete 2026 Guide`, `Everything You Need to Know About ${T}`],
    casual: [`Let's Talk About ${T}`, `${T}, Without the Fluff`],
    inspirational: [`How ${T} Can Change Your Life`, `${T}: Your First Step Toward Something Bigger`],
    educational: [`${T} Explained Step by Step`, `A Beginner's Introduction to ${T}`],
  },
  intro: {
    professional: `${T} is increasingly a focus for experts and businesses alike. This article outlines the key concepts, benefits and practical recommendations to help you make informed decisions.`,
    casual: `You've probably heard about ${T}, but aren't quite sure where to start? No worries – grab a coffee and let's walk through the essentials, nice and easy.`,
    inspirational: `Every big change starts with a single idea. For many people, ${T} was the spark that got them moving. Maybe now it's your turn.`,
    educational: `In this guide we'll explain ${T} from the ground up. By the end, you'll understand the key concepts, know how to get started and which mistakes to avoid.`,
  },
  leads: {
    professional: ["Research suggests that", "From a business perspective,", "In practice,"],
    casual: ["Honestly,", "Here's the thing:", "Let's be real,"],
    inspirational: ["Imagine the moment when", "The best part is that", "Remember that"],
    educational: ["It's important to understand that", "First, keep in mind that", "Simply put,"],
  },
  sections: [
    {
      heading: `What ${T} Really Means`,
      paragraphs: [
        `this field combines ideas, tools and habits that together produce real results. It isn't a passing trend but an approach that has matured over years.`,
        `Many people assume you need a lot of prior knowledge. In reality, understanding a few core principles and applying them consistently is enough.`,
      ],
      bullets: ["A clearly defined goal", "Basic understanding of key terms", "Willingness to learn"],
    },
    {
      heading: "Key Benefits",
      paragraphs: [
        `people who commit to ${T} usually notice saved time, better organization and more confidence in their work.`,
        `On top of that, the benefits compound. Small changes you make today can lead to noticeable progress within a few months.`,
      ],
      bullets: ["Time savings", "Better results", "Higher motivation"],
    },
    {
      heading: "Common Mistakes to Avoid",
      paragraphs: [
        `the biggest mistake is trying to do everything at once. It's better to start with one small step and build gradually.`,
        `Another common mistake is relying on unverified advice. Always check your sources and adapt recommendations to your own situation.`,
      ],
      bullets: ["Too many goals at once", "Lack of consistency", "Comparing yourself to others"],
    },
    {
      heading: "Practical Tips to Get Started",
      paragraphs: [
        `the best start is a simple plan: decide what you want to achieve, how much time you have and how you'll measure progress.`,
        `Write down what you learn and revisit your notes regularly. You'll quickly see what works and what doesn't.`,
      ],
      bullets: ["Make a weekly plan", "Track your progress", "Ask for feedback"],
    },
    {
      heading: "Real-World Examples",
      paragraphs: [
        `many individuals and small teams have already applied these ideas successfully. What they share is that they started small and stayed persistent.`,
        `A typical example is a small company that, by introducing a few simple changes, significantly improved its results within months.`,
      ],
      bullets: ["Small steps, big impact", "Learning from mistakes", "Sharing knowledge with the team"],
    },
    {
      heading: "What the Future Holds",
      paragraphs: [
        `new technologies and tools will make ${T} even more accessible. What is advanced today will be standard tomorrow.`,
        `That's why now is the right time to build a solid foundation and stay one step ahead.`,
      ],
      bullets: ["More automation", "More accessible tools", "Growing demand for expertise"],
    },
  ],
  conclusionHeading: "Conclusion",
  conclusion: {
    professional: `${T} offers clear, measurable benefits to those who approach it systematically. We recommend starting with a pilot step and tracking results with concrete metrics.`,
    casual: `See, that wasn't so bad! Take it slow, try one of these ideas this week and see how it goes.`,
    inspirational: `Don't wait for the perfect moment – it doesn't exist. Take the first step today, and a year from now you'll be glad you started.`,
    educational: `You now know the basics, the benefits, common mistakes and practical steps. Your next task: pick one tip from this article and apply it over the coming week.`,
  },
};

const de: LanguagePack = {
  titles: {
    professional: [`${T}: Der komplette Leitfaden 2026`, `Alles, was Sie über ${T} wissen müssen`],
    casual: [`Lass uns über ${T} reden`, `${T} – ganz entspannt erklärt`],
    inspirational: [`Wie ${T} Ihr Leben verändern kann`, `${T}: Ihr erster Schritt zu etwas Größerem`],
    educational: [`${T} Schritt für Schritt erklärt`, `Einführung in ${T} für Einsteiger`],
  },
  intro: {
    professional: `${T} rückt zunehmend in den Fokus von Fachleuten und Unternehmen. Dieser Artikel gibt einen Überblick über zentrale Begriffe, Vorteile und praktische Empfehlungen.`,
    casual: `Du hast schon von ${T} gehört, weißt aber nicht, wo du anfangen sollst? Kein Problem – schnapp dir einen Kaffee, wir gehen das Wichtigste ganz entspannt durch.`,
    inspirational: `Jede große Veränderung beginnt mit einer Idee. Für viele Menschen war ${T} genau dieser Funke. Vielleicht ist jetzt Ihre Zeit gekommen.`,
    educational: `In diesem Leitfaden erklären wir ${T} von Grund auf. Am Ende kennen Sie die wichtigsten Begriffe, wissen, wie Sie anfangen, und welche Fehler Sie vermeiden sollten.`,
  },
  leads: {
    professional: ["Studien zeigen:", "Aus geschäftlicher Sicht gilt:", "In der Praxis zeigt sich:"],
    casual: ["Ehrlich gesagt:", "Der Punkt ist:", "Mal ehrlich:"],
    inspirational: ["Stellen Sie sich vor:", "Das Schönste daran:", "Vergessen Sie nicht:"],
    educational: ["Wichtig ist:", "Merken Sie sich zuerst:", "Einfach gesagt:"],
  },
  sections: [
    {
      heading: `Was ${T} wirklich bedeutet`,
      paragraphs: [
        `dieses Gebiet verbindet Ideen, Werkzeuge und Gewohnheiten, die gemeinsam echte Ergebnisse liefern. Es ist kein kurzlebiger Trend.`,
        `Viele glauben, man brauche viel Vorwissen. Tatsächlich reicht es, einige Grundprinzipien zu verstehen und konsequent anzuwenden.`,
      ],
      bullets: ["Ein klares Ziel", "Grundverständnis der Begriffe", "Lernbereitschaft"],
    },
    {
      heading: "Die wichtigsten Vorteile",
      paragraphs: [
        `wer sich ernsthaft mit ${T} beschäftigt, spart Zeit, arbeitet organisierter und gewinnt an Selbstvertrauen.`,
        `Außerdem summieren sich die Vorteile mit der Zeit. Kleine Änderungen von heute bringen in einigen Monaten spürbare Fortschritte.`,
      ],
      bullets: ["Zeitersparnis", "Bessere Ergebnisse", "Mehr Motivation"],
    },
    {
      heading: "Häufige Fehler",
      paragraphs: [
        `der größte Fehler ist, alles auf einmal zu wollen. Besser ist es, mit einem kleinen Schritt zu beginnen.`,
        `Ein weiterer Fehler ist, ungeprüften Ratschlägen zu folgen. Prüfen Sie Quellen und passen Sie Empfehlungen an Ihre Situation an.`,
      ],
      bullets: ["Zu viele Ziele gleichzeitig", "Fehlende Konsequenz", "Vergleiche mit anderen"],
    },
    {
      heading: "Praktische Tipps für den Einstieg",
      paragraphs: [
        `der beste Start ist ein einfacher Plan: Was wollen Sie erreichen, wie viel Zeit haben Sie, und wie messen Sie Fortschritt?`,
        `Notieren Sie, was Sie lernen, und lesen Sie Ihre Notizen regelmäßig. So erkennen Sie schnell, was funktioniert.`,
      ],
      bullets: ["Wochenplan erstellen", "Fortschritt verfolgen", "Feedback einholen"],
    },
    {
      heading: "Beispiele aus der Praxis",
      paragraphs: [
        `viele Einzelpersonen und kleine Teams setzen diese Ideen bereits erfolgreich um. Gemeinsam ist ihnen, dass sie klein angefangen haben.`,
        `Ein typisches Beispiel ist ein kleines Unternehmen, das mit einfachen Änderungen seine Ergebnisse innerhalb weniger Monate deutlich verbessert hat.`,
      ],
      bullets: ["Kleine Schritte, große Wirkung", "Aus Fehlern lernen", "Wissen im Team teilen"],
    },
    {
      heading: "Ein Blick in die Zukunft",
      paragraphs: [
        `neue Technologien werden ${T} noch zugänglicher machen. Was heute fortgeschritten ist, wird morgen Standard sein.`,
        `Deshalb ist jetzt der richtige Zeitpunkt, eine solide Grundlage aufzubauen.`,
      ],
      bullets: ["Mehr Automatisierung", "Zugänglichere Werkzeuge", "Steigende Nachfrage"],
    },
  ],
  conclusionHeading: "Fazit",
  conclusion: {
    professional: `${T} bietet klare, messbare Vorteile für alle, die systematisch vorgehen. Wir empfehlen, mit einem Pilotschritt zu beginnen und Ergebnisse anhand konkreter Kennzahlen zu verfolgen.`,
    casual: `Siehst du, gar nicht so schlimm! Probier diese Woche einfach eine Idee aus und schau, wie es läuft.`,
    inspirational: `Warten Sie nicht auf den perfekten Moment – den gibt es nicht. Machen Sie heute den ersten Schritt.`,
    educational: `Jetzt kennen Sie Grundlagen, Vorteile, typische Fehler und praktische Schritte. Ihre nächste Aufgabe: Wenden Sie einen Tipp aus diesem Artikel in der kommenden Woche an.`,
  },
};

const PACKS: Record<Language, LanguagePack> = { sr, en, de };

// Koliko sekcija i pasusa ide u blog za svaku dužinu
const LENGTH_PLAN: Record<Length, { sections: number; paragraphs: 1 | 2; bullets: boolean }> = {
  short: { sections: 3, paragraphs: 1, bullets: false },
  medium: { sections: 4, paragraphs: 2, bullets: true },
  long: { sections: 6, paragraphs: 2, bullets: true },
};

function pick<V>(items: V[]): V {
  return items[Math.floor(Math.random() * items.length)];
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Pravi blog u Markdown formatu (# naslov, ## podnaslov, - lista, **bold**). */
export function generateDemoBlog(options: BlogOptions): string {
  const topic = options.topic.trim();
  const pack = PACKS[options.language];
  const plan = LENGTH_PLAN[options.length];
  const fill = (text: string) => text.split(T).join(topic);

  const parts: string[] = [];
  parts.push(`# ${fill(pick(pack.titles[options.tone]))}`);
  parts.push(fill(pack.intro[options.tone]));

  pack.sections.slice(0, plan.sections).forEach((section, index) => {
    parts.push(`## ${fill(section.heading)}`);
    // Prvi pasus počinje "tonskim" uvodom, npr. "Iskreno," ili "Analize pokazuju da"
    const lead = pack.leads[options.tone][index % pack.leads[options.tone].length];
    // Na nemačkom posle dvotačke ide veliko slovo
    const first = fill(section.paragraphs[0]);
    parts.push(`${lead} ${options.language === "de" ? capitalize(first) : first}`);
    if (plan.paragraphs === 2) parts.push(fill(section.paragraphs[1]));
    if (plan.bullets) {
      parts.push(section.bullets.map((b) => `- **${b}**`).join("\n"));
    }
  });

  parts.push(`## ${pack.conclusionHeading}`);
  parts.push(fill(pack.conclusion[options.tone]));

  return parts.join("\n\n");
}

/**
 * Simulira AI poziv (kašnjenje), da bi interfejs izgledao kao pravi.
 * Ovu funkciju kasnije menjamo pozivom ka API ruti, npr. fetch("/api/generate").
 */
export async function generateBlog(options: BlogOptions): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  return generateDemoBlog(options);
}
