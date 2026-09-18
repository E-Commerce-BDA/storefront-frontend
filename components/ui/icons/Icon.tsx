import type { CSSProperties } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Heart,
  Menu,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Store,
  Trash2,
  Truck,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

/**
 * Dumb Icon — thin wrapper over lucide-react so call sites never import the
 * library directly (a future swap touches this map only, never components).
 *
 * Color: icons are `stroke="currentColor"` — dark on white surfaces, white
 * on dark surfaces — inherited from the parent text color. No color props.
 * Sizes/spacing come from `size`; stroke defaults to 2px (design decision).
 */
export const ICON_NAMES = [
  "heart",
  "store",
  "arrow-left",
  "arrow-right",
  "arrow-up",
  "arrow-down",
  "chevron-left",
  "chevron-right",
  "chevron-up",
  "chevron-down",
  "x",
  "search",
  "shopping-bag",
  "user",
  "menu",
  "plus",
  "minus",
  "check",
  "trash",
  "filter",
  "star",
  "truck",
  "shield-check",
  "returns",
  "eye",
  "share",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

const MAP: Record<IconName, LucideIcon> = {
  heart: Heart,
  store: Store,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "chevron-down": ChevronDown,
  x: X,
  search: Search,
  "shopping-bag": ShoppingBag,
  user: User,
  menu: Menu,
  plus: Plus,
  minus: Minus,
  check: Check,
  trash: Trash2,
  filter: SlidersHorizontal,
  star: Star,
  truck: Truck,
  "shield-check": ShieldCheck,
  returns: RotateCcw,
  eye: Eye,
  share: Share2,
};

export interface IconProps {
  /** Kebab-case icon key. Unknown CMS-driven strings fail closed (null + warn). */
  name: IconName;
  /** Pixel box; lucide scales stroke proportionally. Default 20 (40px IconButton). */
  size?: number;
  /** Filled silhouette (active wishlist heart, rated star). Default outline. */
  filled?: boolean;
  /** Stroke width in px. Default 2 (design decision). */
  strokeWidth?: number;
  /** Accessible name for standalone meaning; omit inside labelled buttons. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

export default function Icon({
  name,
  size = 20,
  filled = false,
  strokeWidth = 2,
  title,
  className,
  style,
}: IconProps) {
  const Cmp = MAP[name];
  if (!Cmp) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Icon] unknown icon name: "${String(name)}" — rendering nothing.`);
    }
    return null;
  }
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      fill={filled ? "currentColor" : "none"}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
      style={style}
    >
      {title ? <title>{title}</title> : null}
    </Cmp>
  );
}
