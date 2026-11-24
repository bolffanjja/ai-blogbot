// React hook koji daje listu blogova i sam je osvežava kada se nešto promeni
// (u ovom tabu ili u drugom tabu istog browsera).
// Podaci se čitaju tek u browseru (u useEffect), pa nema grešaka pri server renderovanju.

import { useEffect, useState } from "react";
import { blogRepository } from "./store";
import { storageErrorMessage, type Blog } from "./types";

export interface BlogsState {
  status: "loading" | "ready" | "error";
  blogs: Blog[];
  warning: string | null;
  error: string | null;
}

export function useBlogs(): BlogsState {
  const [state, setState] = useState<BlogsState>({
    status: "loading",
    blogs: [],
    warning: null,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const load = () => {
      blogRepository.list().then(
        (result) => {
          if (active) setState({ status: "ready", blogs: result.blogs, warning: result.warning, error: null });
        },
        (error: unknown) => {
          if (active) setState((s) => ({ ...s, status: "error", error: storageErrorMessage(error) }));
        },
      );
    };
    load();
    const unsubscribe = blogRepository.subscribe(load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return state;
}
