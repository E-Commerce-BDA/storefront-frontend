
export const AUTH_CHANGED_EVENT = "sf:auth-changed";

export function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
}

