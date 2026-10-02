import type { CSSProperties, ReactNode } from "react";
import type { AuthMode } from "@/lib/auth/settings";

/**
 * Dumb AuthPage — scope shell. Applies the resolved --auth-* var map once;
 * everything below inherits. Mode switches centered vs split composition.
 * props → JSX only. No fetch, no state.
 */
export interface AuthPageProps {
  vars: Record<string, string>;
  mode?: AuthMode;
  children: ReactNode;
  className?: string;
}

export default function AuthPage({ vars, mode = "split", children, className = "" }: AuthPageProps) {
  return (
    <div className={`sf-auth ${className}`} style={vars as CSSProperties} data-mode={mode}>
      {children}
    </div>
  );
}
