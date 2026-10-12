import { forwardRef, useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "./icons";
import type { ResolvedOverlayMotion } from "@/lib/search/motion";

/**
 * Dumb Select — native branch by default (custom listbox via
 * variant="custom"). Native menus are OS chrome: button-face knobs apply,
 * list-interior knobs (option hover/selected faces, animation) are
 * documented-ignored on native — that split is why the custom branch
 * exists (see components/customization.md).
 */
export interface SelectOption {
  value: string;
  label: string;
}

export type SelectVariant = "native" | "custom";

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> {
  value: string;
  // e optional: the custom branch has no DOM event to hand over (commit
  // comes from keyboard/click on popup options, not a change event).
  onChange?: (value: string, e?: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  label?: string;
  helper?: string;
  error?: string;
  placeholder?: string;
  radius?: number;
  borderColor?: string;
  /** House paint (theme feeds; flat wins). Absent = component tokens. */
  bg?: string;
  textColor?: string;
  focusBorderColor?: string;
  /** Branch selector (default native — zero-breakage). */
  variant?: SelectVariant;
  /** CMS media URL for the arrow (empty = chevron-down glyph). */
  arrowIconUrl?: string;
  /** Arrow right-offset px (arrow hit-area padding). */
  arrowPadding?: number;
  /**
   * Popup open state (custom branch only). Controlled when provided,
   * internally owned otherwise — the browser owns this natively, so a
   * drop-in replacement must too (AGENTS.md allowlist: select-popup).
   * Value itself stays strictly controlled either way.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Popup motion (custom branch only). Default mirrors the builtin
   * (subtle fast fade); theme.dropdownAnimation feeds this at the owner.
   * Disabled motion renders no vars (CSS fallbacks stay instant-safe).
   */
  listMotion?: ResolvedOverlayMotion;
  /**
   * Popup faces (custom branch only). Non-empty values inline as --se-*
   * vars; absent faces stay token-backed (empty vars would void the
   * paint — never inlined, see header). Theme feeds at the owner.
   */
  listTheme?: {
    selectedBg?: string;
    selectedText?: string;
    hoverBg?: string;
    hoverText?: string;
    optionPaddingY?: number;
  };
}

/**
 * Arrow glyph with upload fallback. The chevron always renders beneath;
 * a broken CMS URL removes its own <img> imperatively (decorative node
 * only — no React state, so the dumb contract holds; re-renders
 * self-heal by re-firing onError).
 */
function ArrowGlyph({ url }: { url?: string }) {
  if (!url) return <Icon name="chevron-down" size={16} />;
  return (
    <>
      <Icon name="chevron-down" size={16} />
      {/* alt="" deliberate: the select is already labelled. */}
      <img
        src={url}
        alt=""
        aria-hidden="true"
        onError={(e) => e.currentTarget.remove()}
      />
    </>
  );
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { value, onChange, options, label, helper, error, placeholder = "Select…", radius = 10, borderColor, bg, textColor, focusBorderColor, variant = "native", arrowIconUrl, arrowPadding = 12,   open: controlledOpen, onOpenChange, listMotion = { enabled: true, durationMs: 180, easing: "ease-out", travel: "minimal" }, listTheme, id, disabled = false, required = false, className = "", style = {}, ...rest },
  ref,
) {
  const invalid = error != null && error !== "";
  const fieldId = id ?? (label ? `sf-sel-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

  const labelNode = label && (
    <label htmlFor={fieldId} className="text-xs font-semibold tracking-wide text-[var(--color-ink)]">
      {label} {required && <span aria-hidden>*</span>}
    </label>
  );
  const footNode = invalid ? (
    <p role="alert" className="m-0 text-xs text-[var(--color-error)]">
      {error}
    </p>
  ) : helper ? (
    <p className="m-0 text-[13px] text-[var(--text-muted)]">{helper}</p>
  ) : null;

  if (variant === "custom") {
    return (
      <div className={`grid gap-1.5 ${className}`} style={style}>
        {labelNode}
        <SelectListbox
          value={value}
          options={options}
          placeholder={placeholder}
          disabled={disabled}
          invalid={invalid}
          fieldId={fieldId}
          radius={radius}
          borderColor={borderColor}
          bg={bg}
          textColor={textColor}
          focusBorderColor={focusBorderColor}
          arrowIconUrl={arrowIconUrl}
          arrowPadding={arrowPadding}
          controlledOpen={controlledOpen}
          onOpenChange={onOpenChange}
          listMotion={listMotion}
          listTheme={listTheme}
          onValue={(v) => onChange?.(v)}
        />
        {footNode}
      </div>
    );
  }

  return (
    <div className={`grid gap-1.5 ${className}`} style={style}>
      {labelNode}
      <div className="sf-selectwrap">
        <select
          ref={ref}
          id={fieldId}
          // sf-select hook: themed focus border paints through --se-focus
          // (Textarea pattern). appearance-none drops the OS arrow; the
          // arrow layer below replaces it (icon or uploaded URL).
          className="sf-select min-h-10 w-full appearance-none py-2.5 pl-3 text-sm text-[var(--color-ink)] outline-0 focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
          data-focus={focusBorderColor ? "custom" : "default"}
          data-variant={variant}
          style={{
            border: `1px solid ${invalid ? "var(--color-error)" : (borderColor ?? "var(--border)")}`,
            borderRadius: radius,
            background: bg ?? "var(--color-navbar-bg, #ffffff)",
            color: textColor,
            paddingRight: `calc(${arrowPadding}px + 24px)`,
            ...(focusBorderColor ? ({ "--se-focus": focusBorderColor } as CSSProperties) : {}),
            opacity: disabled ? 0.6 : undefined,
          }}
          value={value}
          onChange={(e) => onChange?.(e.target.value, e)}
          disabled={disabled}
          required={required}
          aria-invalid={invalid}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {/* Arrow layer (decorative — the select is already labelled). */
        /* img onError falls back to the glyph (broken CMS URL never blanks). */}
        <span className="sf-select__arrow" aria-hidden="true" style={{ right: arrowPadding }}>
          <ArrowGlyph url={arrowIconUrl} />
        </span>
      </div>
      {footNode}
    </div>
  );
});

/**
 * Custom listbox branch (variant="custom") — full WAI-ARIA listbox:
 * arrows cycle, type-ahead jumps, Home/End bound, Enter commits,
 * Esc closes + refocuses, Tab closes (focus moves on), outside-click
 * closes. Focus stays on the trigger; aria-activedescendant points at
 * the active option. Type-ahead uses timestamps, not timers (no-timer
 * rule holds). Motion: subtle fade + 4px rise, var-driven, killed by
 * the reduced-motion guard; instant when disabled upstream.
 */
interface SelectListboxProps {
  value: string;
  options: SelectOption[];
  placeholder: string;
  disabled: boolean;
  invalid: boolean;
  fieldId: string | undefined;
  radius: number;
  borderColor: string | undefined;
  bg: string | undefined;
  textColor: string | undefined;
  focusBorderColor: string | undefined;
  arrowIconUrl: string | undefined;
  arrowPadding: number;
  controlledOpen: boolean | undefined;
  onOpenChange: ((open: boolean) => void) | undefined;
  listMotion: ResolvedOverlayMotion;
  listTheme:
    | {
        selectedBg?: string;
        selectedText?: string;
        hoverBg?: string;
        hoverText?: string;
        optionPaddingY?: number;
      }
    | undefined;
  onValue: (v: string) => void;
}

function SelectListbox({
  value,
  options,
  placeholder,
  disabled,
  invalid,
  fieldId,
  radius,
  borderColor,
  bg,
  textColor,
  focusBorderColor,
  arrowIconUrl,
  arrowPadding,
  controlledOpen,
  onOpenChange,
  listMotion,
  listTheme,
  onValue,
}: SelectListboxProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [active, setActive] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const typeRef = useRef<{ buf: string; at: number }>({ buf: "", at: 0 });

  const setOpen = (o: boolean) => {
    onOpenChange?.(o);
    if (controlledOpen === undefined) setInternalOpen(o);
  };

  // Active follows the value on open (fresh context every time).
  useEffect(() => {
    if (open) setActive(value || null);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Outside-click closes (same document-listener pattern as overlay traps).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Active option scrolls into view (nearest — never yanks the page).
  useEffect(() => {
    if (!open || active == null) return;
    rootRef.current?.querySelector(`[data-value="${CSS.escape(active)}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const selected = options.find((o) => o.value === value);

  function commit(v: string) {
    onValue(v);
    setOpen(false);
    btnRef.current?.focus();
  }

  function move(dir: 1 | -1) {
    if (options.length === 0) return;
    const idx = options.findIndex((o) => o.value === active);
    const next = options[(idx + dir + options.length) % options.length];
    setActive(next.value);
  }

  function typeAhead(ch: string) {
    const now = Date.now();
    const buf = now - typeRef.current.at < 500 ? typeRef.current.buf + ch : ch;
    typeRef.current = { buf, at: now };
    const needle = buf.toLowerCase();
    const start = Math.max(0, options.findIndex((o) => o.value === active));
    const pool = [...options.slice(start + 1), ...options.slice(0, start + 1)];
    const hit = pool.find((o) => o.label.toLowerCase().startsWith(needle));
    if (hit) setActive(hit.value);
  }

  function onKey(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      if (options.length > 0) setActive(options[0].value);
    } else if (e.key === "End") {
      e.preventDefault();
      if (options.length > 0) setActive(options[options.length - 1].value);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (active != null) commit(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    } else if (e.key === "Tab") {
      // Tab closes (focus moves on naturally — never trapped here).
      setOpen(false);
    } else if (e.key.length === 1) {
      typeAhead(e.key);
    }
  }

  return (
    <div ref={rootRef} className="sf-selectwrap" onKeyDown={onKey}>
      <button
        ref={btnRef}
        type="button"
        id={fieldId}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="sf-select min-h-10 w-full appearance-none py-2.5 pl-3 text-left text-sm outline-0 focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
        data-focus={focusBorderColor ? "custom" : "default"}
        data-open={open}
        style={{
          border: `1px solid ${invalid ? "var(--color-error)" : (borderColor ?? "var(--border)")}`,
          borderRadius: radius,
          background: bg ?? "var(--color-navbar-bg, #ffffff)",
          color: selected ? textColor : "var(--text-muted)",
          paddingRight: `calc(${arrowPadding}px + 24px)`,
          ...(focusBorderColor ? ({ "--se-focus": focusBorderColor } as CSSProperties) : {}),
          opacity: disabled ? 0.6 : undefined,
        }}
      >
        <span className="block truncate">{selected ? selected.label : placeholder}</span>
      </button>
      <span className="sf-select__arrow" aria-hidden="true" style={{ right: arrowPadding }}>
        <ArrowGlyph url={arrowIconUrl} />
      </span>
      {open && (
        <ul
          role="listbox"
          aria-label={fieldId ?? "Options"}
          aria-activedescendant={active ? `sf-opt-${active}` : undefined}
          data-motion={listMotion.enabled ? "on" : "off"}
          className="sf-select__list"
          style={{
            borderRadius: radius,
            ...(listMotion.enabled
              ? {
                  "--se-list-duration": `${listMotion.durationMs}ms`,
                  "--se-list-easing": listMotion.easing,
                }
              : {}),
            // Empty faces never inline (an empty var voids the paint —
            // token fallbacks hold instead).
            ...(listTheme?.selectedBg ? { "--se-selected-bg": listTheme.selectedBg } : {}),
            ...(listTheme?.selectedText ? { "--se-selected-text": listTheme.selectedText } : {}),
            ...(listTheme?.hoverBg ? { "--se-hover-bg": listTheme.hoverBg } : {}),
            ...(listTheme?.hoverText ? { "--se-hover-text": listTheme.hoverText } : {}),
            ...(typeof listTheme?.optionPaddingY === "number"
              ? { "--se-opt-pad-y": `${listTheme.optionPaddingY}px` }
              : {}),
          } as CSSProperties}
        >
          {options.length === 0 && (
            <li role="option" aria-selected="false" aria-disabled="true" className="sf-select__empty">
              No options available
            </li>
          )}
          {options.map((o) => (
            <li
              key={o.value}
              id={`sf-opt-${o.value}`}
              role="option"
              aria-selected={o.value === value}
              data-value={o.value}
              data-active={o.value === active}
              data-selected={o.value === value}
              onClick={() => commit(o.value)}
              onMouseMove={() => {
                if (active !== o.value) setActive(o.value);
              }}
              className="sf-select__option"
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Select;
