import { Children, cloneElement, isValidElement, useId } from "react";

/**
 * Dumb Tooltip — server component, zero JS positioning (pure CSS).
 * Hover or keyboard-focus the trigger and the bubble appears; nothing
 * measures the viewport (no flip — see components/tooltip.md §4).
 *
 * Color: fixed ink bubble + white text, readable on page surfaces AND on
 * product images. No color props — like Icon, it never adapts, so it never
 * mismatches.
 */
export type TooltipPlacement = "top" | "bottom" | "left" | "right";
export type TooltipMode = "custom" | "product-name" | "position";
export type TooltipAnimation = "slide" | "fade" | "none";

/**
 * Style + motion knobs. Every field optional (absent = today's look);
 * units and clamping resolved in DEFAULT_TOOLTIP_STYLE / the component.
 * Co-located (not lib/cms) until the CMS exists — the resolver will consume
 * this exact shape later without changing the component.
 */
export interface TooltipStyleField {
  bg?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  radius?: number;
  fontSize?: number;
  fontWeight?: number;
  animation?: TooltipAnimation;
  durationMs?: number;
  offset?: number;
}

export const DEFAULT_TOOLTIP_STYLE: Required<TooltipStyleField> = {
  bg: "#0a2540",
  textColor: "#ffffff",
  borderColor: "transparent",
  borderWidth: 0,
  radius: 8,
  fontSize: 12,
  fontWeight: 500,
  animation: "slide",
  durationMs: 160,
  offset: 8,
};

export const TOOLTIP_LIMITS = {
  borderWidth: { min: 0, max: 2 },
  radius: { min: 0, max: 16 },
  fontSize: { min: 11, max: 14 },
  durationMs: { min: 0, max: 500 },
  offset: { min: 4, max: 16 },
} as const;

export interface TooltipProps {
  /** Trigger element (button, dot, image tile, navbar item…). Required. */
  children: React.ReactNode;
  /** Which text to show. Default "custom". */
  mode?: TooltipMode;
  /** Admin-typed text (mode "custom"). */
  content?: React.ReactNode;
  /** Bound product name (mode "product-name"). */
  productName?: string;
  /** 0-based index + total (mode "position" → "2 of 3"). */
  index?: number;
  total?: number;
  /** Master switch (admin toggle). Default true — but with no resolvable
   *  text the trigger renders bare regardless (zero tooltip DOM). */
  enabled?: boolean;
  placement?: TooltipPlacement;
  /** Show delay in ms. Default 200. */
  delayMs?: number;
  /** Bubble max width in px. Default 240. */
  maxWidth?: number;
  /** Arrow nub. Default true. */
  showArrow?: boolean;
  /** Controlled override: true forces visible, false forces hidden.
   *  Omit for automatic hover/focus behavior. Escape handling belongs to
   *  the parent in controlled mode (this component ships no JS). */
  open?: boolean;
  className?: string;
  style?: React.CSSProperties;
  // Style knobs below mirror TooltipStyleField one-prop-per-knob
  // (flat wins over styleOverrides — same convention as Button).
  tipBg?: string;
  tipTextColor?: string;
  tipBorderColor?: string;
  tipBorderWidth?: number;
  tipRadius?: number;
  tipFontSize?: number;
  tipFontWeight?: number;
  tipAnimation?: TooltipAnimation;
  tipDurationMs?: number;
  tipOffset?: number;
  /** Future CMS object payload. Lowest precedence. */
  styleOverrides?: TooltipStyleField;
}

function resolveText(props: Pick<TooltipProps, "mode" | "content" | "productName" | "index" | "total">): React.ReactNode {
  switch (props.mode ?? "custom") {
    case "product-name":
      return props.productName && props.productName !== "" ? props.productName : null;
    case "position":
      return props.index != null && props.total != null && props.total > 0
        ? `${props.index + 1} of ${props.total}`
        : null;
    default:
      return props.content ?? null;
  }
}

function clampInt(v: number | undefined, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
}

export default function Tooltip({
  children,
  mode = "custom",
  content,
  productName,
  index,
  total,
  enabled = true,
  placement = "top",
  delayMs = 200,
  maxWidth = 240,
  showArrow = true,
  open,
  className = "",
  style = {},
  tipBg,
  tipTextColor,
  tipBorderColor,
  tipBorderWidth,
  tipRadius,
  tipFontSize,
  tipFontWeight,
  tipAnimation,
  tipDurationMs,
  tipOffset,
  styleOverrides,
}: TooltipProps) {
  const rawId = useId();
  const tipId = `sf-tip-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const text = resolveText({ mode, content, productName, index, total });
  const textEmpty = text == null || (typeof text === "string" && text.trim() === "");

  // No text or toggled off → bare trigger. No bubble, no describedby,
  // no listeners: the ineligible/hidden case costs nothing.
  if (!enabled || textEmpty) {
    return <>{children}</>;
  }

  const visibility = open == null ? undefined : open ? "on" : "off";

  // Style resolution: flat props win over the styleOverrides object, absent
  // falls back to DEFAULT_TOOLTIP_STYLE; numerics clamp to TOOLTIP_LIMITS.
  // (The CMS resolver will feed styleOverrides later — same shape, no
  // component change.)
  const o = styleOverrides ?? {};
  const D = DEFAULT_TOOLTIP_STYLE;
  const L = TOOLTIP_LIMITS;
  const animation = tipAnimation ?? o.animation ?? D.animation;
  const tipVars = {
    "--tip-bg": tipBg ?? o.bg ?? D.bg,
    "--tip-text": tipTextColor ?? o.textColor ?? D.textColor,
    "--tip-border-color": tipBorderColor ?? o.borderColor ?? D.borderColor,
    "--tip-border-width": `${clampInt(tipBorderWidth ?? o.borderWidth, L.borderWidth.min, L.borderWidth.max, D.borderWidth)}px`,
    "--tip-radius": `${clampInt(tipRadius ?? o.radius, L.radius.min, L.radius.max, D.radius)}px`,
    "--tip-font-size": `${clampInt(tipFontSize ?? o.fontSize, L.fontSize.min, L.fontSize.max, D.fontSize)}px`,
    "--tip-font-weight": tipFontWeight ?? o.fontWeight ?? D.fontWeight,
    "--tip-duration": `${clampInt(tipDurationMs ?? o.durationMs, L.durationMs.min, L.durationMs.max, D.durationMs)}ms`,
    "--tip-offset": `${clampInt(tipOffset ?? o.offset, L.offset.min, L.offset.max, D.offset)}px`,
  } as React.CSSProperties;

  // Associate the bubble with the trigger for assistive tech: a single
  // element child gets a merged aria-describedby; anything else (text,
  // fragments) keeps the wrapper-level linkage as best effort.
  const onlyChild = Children.count(children) === 1 ? Children.toArray(children)[0] : null;
  const trigger =
    isValidElement<{ "aria-describedby"?: string }>(onlyChild) ?
      cloneElement(onlyChild, {
        "aria-describedby": [onlyChild.props["aria-describedby"], tipId].filter(Boolean).join(" "),
      })
    : <span className="sf-tip__trigger" aria-describedby={tipId}>
        {children}
      </span>;

  return (
    <span
      className={`sf-tip ${className}`}
      style={style}
      data-tip-open={visibility}
    >
      {trigger}
      <span
        id={tipId}
        role="tooltip"
        className="sf-tip__bubble"
        data-placement={placement}
        data-arrow={showArrow ? "on" : "off"}
        data-tip-anim={animation}
        style={
          {
            "--tip-delay": `${delayMs}ms`,
            "--tip-max-width": `${maxWidth}px`,
            ...tipVars,
          } as React.CSSProperties
        }
      >
        {text}
      </span>
    </span>
  );
}
