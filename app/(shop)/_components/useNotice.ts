"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Notice {
  open: boolean;
  title: string;
  message?: string;
  kind: "success" | "error";
}

/** Owner-timed Toast state shared by the account islands (sf-059). */
export function useNotice() {
  const [notice, setNotice] = useState<Notice>({ open: false, title: "", kind: "success" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const notify = useCallback((title: string, options?: { message?: string; kind?: "success" | "error" }) => {
    setNotice({ open: true, title, message: options?.message, kind: options?.kind ?? "success" });
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice((prev) => ({ ...prev, open: false })), 4000);
  }, []);

  const close = useCallback(() => setNotice((prev) => ({ ...prev, open: false })), []);

  return { notice, notify, close };
}
