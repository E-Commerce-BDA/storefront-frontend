import type { ReactNode } from "react";

/**
 * Auth routes layout — shares the shop gutter and responsive container.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="sf-shop min-h-[calc(100vh-160px)] py-8 flex items-center justify-center">
      {children}
    </div>
  );
}
