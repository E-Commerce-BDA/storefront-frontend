"use client";

/**
 * Source-injected options hook — owns list state (options, status);
 * knows nothing about endpoints. Loads on mount, reloads on demand;
 * AbortController stale-kill + unmount-abort (stale lists never land).
 * Third instance of the useSearch discipline, minus debounce (no typing
 * here — single fetch per load, not per keystroke).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { SelectOption, OptionsSource } from "@/lib/select/options";

export type OptionsStatus = "idle" | "loading" | "done" | "error";

export interface UseSelectOptions {
  options: SelectOption[];
  status: OptionsStatus;
  reload: () => void;
}

export function useSelectOptions(source: OptionsSource): UseSelectOptions {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [status, setStatus] = useState<OptionsStatus>("idle");
  const seq = useRef(0);
  const live = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    live.current?.abort();
    const id = ++seq.current;
    const controller = new AbortController();
    live.current = controller;
    setStatus("loading");
    source
      .list(controller.signal)
      .then((rows) => {
        // Stale responses never overwrite: only the latest load lands.
        if (seq.current === id) {
          setOptions(rows);
          setStatus("done");
        }
      })
      .catch((err: unknown) => {
        if (seq.current === id && !(err instanceof Error && err.message === "aborted")) {
          setOptions([]);
          setStatus("error");
        }
      });
  }, [source]);

  // Mount loads once; unmount aborts the flight.
  useEffect(() => {
    load();
    return () => {
      live.current?.abort();
    };
  }, [load]);

  return { options, status, reload: load };
}
