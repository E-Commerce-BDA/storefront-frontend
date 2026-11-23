"use client";

/**
 * Variant ↔ URL state — sf-055 (routing.md §4)
 *
 * The URL is the source of truth for the chosen variant: shared links land on
 * the exact combination, a committed choice pushes a history entry (so Back
 * steps through tried variants), and an invalid/out-of-stock URL is repaired
 * with a quiet `replace` plus a notice — never a 404, never a silent wrong
 * variant. All decisions live in `lib/commerce/variantUrl`; this hook only
 * owns the router calls and the transient notice.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProductOptionDto, ProductVariantDto } from "@/lib/catalog/schemas";
import {
  selectionFromQuery,
  selectionToQuery,
} from "@/lib/commerce/variantUrl";
import { orderedOptions, type VariantSelection } from "@/lib/commerce/variants";

function orderedNames(options: readonly ProductOptionDto[]): string[] {
  return orderedOptions(options).map((option) => option.name);
}

export interface UseVariantFromURL {
  selection: VariantSelection;
  notice: boolean;
  select: (optionName: string, valueId: string) => void;
}

export function useVariantFromURL(
  options: readonly ProductOptionDto[],
  variants: readonly ProductVariantDto[],
): UseVariantFromURL {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const [selection, setSelection] = useState<VariantSelection>(() =>
    selectionFromQuery(new URLSearchParams(queryString), options, variants).selection,
  );
  const [notice, setNotice] = useState(false);
  const replaced = useRef(false);
  const signatureRef = useRef<string | null>(null);
  const pendingRef = useRef<string | null>(null);

  // Sync on URL change (shared link, Back/Forward) and when the product's
  // option/variant shape changes. A self-inflicted `replace` is skipped once
  // so the repair does not loop.
  useEffect(() => {
    if (replaced.current) {
      replaced.current = false;
      return;
    }
    const parsed = selectionFromQuery(
      new URLSearchParams(queryString),
      options,
      variants,
    );
    const parsedSignature = JSON.stringify(
      orderedNames(options).map((name) => parsed.selection[name] ?? ""),
    );

    if (pendingRef.current !== null) {
      if (pendingRef.current === parsedSignature) pendingRef.current = null;
      else return;
    }

    // Only commit when the selection actually changed. A fresh router object
    // from a mock (or a parent re-render) must not drive an infinite loop of
    // "set state → re-render → effect → set state".
    if (parsedSignature !== signatureRef.current) {
      signatureRef.current = parsedSignature;
      setSelection(parsed.selection);
    }
    setNotice(parsed.rewritten);

    if (parsed.rewritten) {
      const canonical = selectionToQuery(parsed.selection, options);
      if (canonical !== queryString) {
        replaced.current = true;
        router.replace(
          canonical === "" ? pathname : `${pathname}?${canonical}`,
          { scroll: false },
        );
      }
    }
  }, [queryString, options, variants, router, pathname]);

  const select = useCallback(
    (optionName: string, valueId: string) => {
      const next = { ...selection, [optionName]: valueId };
      pendingRef.current = JSON.stringify(
        orderedNames(options).map((name) => next[name] ?? ""),
      );
      signatureRef.current = pendingRef.current;
      setSelection(next);
      setNotice(false);
      const canonical = selectionToQuery(next, options);
      router.push(
        canonical === "" ? pathname : `${pathname}?${canonical}`,
        { scroll: false },
      );
    },
    [selection, options, router, pathname],
  );

  return { selection, notice, select };
}
