// Pretraga, filtriranje i sortiranje liste blogova.
// Čista funkcija (bez React-a), pa je lako testirati.

import type { Language } from "../options";
import { normalizeForSearch } from "../text";
import type { Blog, BlogStatus } from "./types";

export type SortOrder = "updated-desc" | "created-desc" | "created-asc";

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "updated-desc", label: "Poslednje izmenjeni" },
  { value: "created-desc", label: "Najnoviji prvo" },
  { value: "created-asc", label: "Najstariji prvo" },
];

export interface BlogFilters {
  query: string;
  language: Language | "all";
  status: BlogStatus | "all";
  sort: SortOrder;
}

export const DEFAULT_FILTERS: BlogFilters = {
  query: "",
  language: "all",
  status: "all",
  sort: "updated-desc",
};

export function filterBlogs(blogs: Blog[], filters: BlogFilters): Blog[] {
  const query = normalizeForSearch(filters.query);

  const result = blogs.filter(
    (blog) =>
      (!query || normalizeForSearch(blog.title).includes(query)) &&
      (filters.language === "all" || blog.language === filters.language) &&
      (filters.status === "all" || blog.status === filters.status),
  );

  const time = (iso: string) => Date.parse(iso) || 0;
  switch (filters.sort) {
    case "created-asc":
      return result.sort((a, b) => time(a.createdAt) - time(b.createdAt));
    case "created-desc":
      return result.sort((a, b) => time(b.createdAt) - time(a.createdAt));
    default:
      return result.sort((a, b) => time(b.updatedAt) - time(a.updatedAt));
  }
}
