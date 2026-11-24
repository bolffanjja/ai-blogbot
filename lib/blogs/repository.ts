// "Ugovor" za pristup blogovima.
// Ostatak aplikacije zna samo za ove funkcije, a ne i GDE se podaci čuvaju.
// Danas: localStorage (localStorageRepository.ts).
// Kasnije: prava baza — napravimo novu klasu sa istim funkcijama i zamenimo je u index.ts.
//
// Sve funkcije vraćaju Promise (async), jer prava baza uvek odgovara sa zakašnjenjem.
// Tako komponente neće morati da se menjaju kada pređemo na bazu.

import type { Blog, BlogChanges, NewBlog } from "./types";

export interface LoadResult {
  blogs: Blog[];
  /** Upozorenje za korisnika, npr. da su neki podaci bili oštećeni */
  warning: string | null;
}

export interface UpdateOptions {
  /**
   * Datum poslednje izmene koji je editor video kada je otvorio blog.
   * Ako se razlikuje od sačuvanog, blog je u međuvremenu menjan u drugom tabu
   * i čuvanje se odbija (greška CONFLICT), osim ako korisnik potvrdi.
   */
  expectedUpdatedAt?: string;
}

export interface BlogRepository {
  /** Svi blogovi, bez posebnog redosleda. */
  list(): Promise<LoadResult>;
  /** Jedan blog ili null ako ne postoji. */
  get(id: string): Promise<Blog | null>;
  /** Čuva novi blog i vraća ga sa ID-jem i datumima. */
  create(input: NewBlog): Promise<Blog>;
  /** Menja postojeći blog (bez pravljenja duplikata) i vraća novu verziju. */
  update(id: string, changes: BlogChanges, options?: UpdateOptions): Promise<Blog>;
  /** Briše blog. */
  remove(id: string): Promise<void>;
  /** Poziva funkciju kad god se podaci promene (i u drugom tabu). Vraća funkciju za odjavu. */
  subscribe(listener: () => void): () => void;
}
