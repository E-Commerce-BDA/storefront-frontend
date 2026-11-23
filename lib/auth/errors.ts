
export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_TAKEN"
  | "TOKEN_EXPIRED"
  | "TOKEN_REUSED"
  | "ACCOUNT_DISABLED"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE";

export interface AuthErrorDisplay {
  code: string;
  message: string;
}

export const GENERIC_AUTH_ERROR: AuthErrorDisplay = {
  code: "INVALID_CREDENTIALS",
  message: "Invalid email or password.",
};

const COPY: Record<AuthErrorCode, AuthErrorDisplay> = {
  INVALID_CREDENTIALS: GENERIC_AUTH_ERROR,
  EMAIL_TAKEN: {
    code: "EMAIL_TAKEN",
    message: "An account with this email already exists. Sign in instead?",
  },
  TOKEN_EXPIRED: {
    code: "TOKEN_EXPIRED",
    message: "Your session expired. Please sign in again.",
  },
  TOKEN_REUSED: {
    code: "TOKEN_REUSED",
    message: "Signed out for protection. Please sign in again.",
  },
  ACCOUNT_DISABLED: {
    code: "ACCOUNT_DISABLED",
    message: "This account is disabled. Contact support for help.",
  },
  VALIDATION_FAILED: {
    code: "VALIDATION_FAILED",
    message: "Check the highlighted fields and try again.",
  },
  RATE_LIMITED: {
    code: "RATE_LIMITED",
    message: "Too many attempts. Try again shortly.",
  },
  SERVICE_UNAVAILABLE: {
    code: "SERVICE_UNAVAILABLE",
    message: "We couldn't reach sign-in right now. Try again in a moment.",
  },
};

const KNOWN = new Set<string>(Object.keys(COPY));

export function isAuthErrorCode(code: unknown): code is AuthErrorCode {
  return typeof code === "string" && KNOWN.has(code);
}

export function displayFor(code: unknown): AuthErrorDisplay {
  if (isAuthErrorCode(code)) return COPY[code];
  return GENERIC_AUTH_ERROR;
}
