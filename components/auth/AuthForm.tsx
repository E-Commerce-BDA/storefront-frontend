import type { FormEvent, ReactNode } from "react";
import type { ErrorStyle } from "@/lib/auth/settings";
import Button from "@/components/ui/Button";

/**
 * Dumb AuthForm — card shell: title, page-owned fields (children), envelope
 * error (banner or inline), submit with loading face. Field rendering and
 * validation display belong to the page (smart); this shell arranges.
 * props → JSX only. No fetch.
 */
export interface AuthFormError {
  code: string;
  message: string;
}

export interface AuthFormProps {
  title: string;
  children: ReactNode;
  error?: AuthFormError | null;
  errorStyle?: ErrorStyle;
  submitLabel: string;
  loading?: boolean;
  onSubmit: (e: FormEvent) => void;
  footer?: ReactNode;
  className?: string;
}

export default function AuthForm({
  title,
  children,
  error = null,
  errorStyle = "banner",
  submitLabel,
  loading = false,
  onSubmit,
  footer,
  className = "",
}: AuthFormProps) {
  return (
    <div className={`sf-auth__card ${className}`}>
      <h3 className="sf-auth__form-title">{title}</h3>
      <form
        onSubmit={onSubmit}
        className="sf-auth__fields"
        data-error-style={errorStyle}
        data-loading={loading}
      >
        {children}
        {error && errorStyle === "banner" && (
          <p role="alert" className="sf-auth__err-banner">
            <code>{error.code}</code> {error.message}
          </p>
        )}
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
        {error && errorStyle === "inline" && (
          <p role="alert" className="sf-auth__err-inline">
            <code>{error.code}</code> {error.message}
          </p>
        )}
      </form>
      {footer && <div className="sf-auth__footer">{footer}</div>}
    </div>
  );
}
