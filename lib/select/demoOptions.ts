/**
 * Demo options source — clearly-named throwaway for previews and tests.
 * Same shapes the CMS/service source will return; swapped at the call
 * site (one line) when it lands. Never import from production routes.
 */
import type { SelectOption, OptionsSource } from "./options";

const COUNTRIES: SelectOption[] = [
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "in", label: "India" },
  { value: "jp", label: "Japan" },
  { value: "br", label: "Brazil" },
  { value: "ae", label: "United Arab Emirates" },
];

export function createDemoOptions(delayMs = 150): OptionsSource {
  return {
    list(signal: AbortSignal): Promise<SelectOption[]> {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve(COUNTRIES), delayMs);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new Error("aborted"));
        });
      });
    },
  };
}
