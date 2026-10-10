import { Icon } from "@/components/ui";

/**
 * Dumb AnnouncementBar — controlled carousel shell for announcement items.
 * Renders the slide it is told (activeIndex); rotation state, timers and
 * dismissal memory live in the hook/route — this file fires callbacks.
 * Empty items render nothing (absent data, absent UI). Arrows render only
 * when there is somewhere to go (showArrows + 2..n items). props → JSX.
 */
export interface AnnouncementItem {
  text: string;
  cta: { label: string; href: string } | null;
  countdownTo: string;
}

export interface AnnouncementBarProps {
  items: AnnouncementItem[];
  activeIndex?: number;
  showArrows?: boolean;
  /** Derived display string (timer owned by the hook, text rendered here). */
  countdownText?: string;
  dismissible?: boolean;
  /** True while the owner animates dismissal (CSS collapses, then unmounts). */
  collapsing?: boolean;
  onDismiss?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}

export default function AnnouncementBar({
  items,
  activeIndex = 0,
  showArrows = true,
  countdownText = "",
  dismissible = true,
  collapsing = false,
  onDismiss,
  onPrev,
  onNext,
  className = "",
}: AnnouncementBarProps) {
  if (items.length === 0) return null;
  // Reason for ??: stale hook index (e.g. items shrank) renders the first
  // slide, never blank. Selection safety, not a theming default.
  const active = items[activeIndex] ?? items[0];
  const canSlide = showArrows && items.length > 1;

  return (
    <div className="sf-announce-collapse" data-collapsed={collapsing}>
      <div className={`sf-announce ${className}`} data-slides={items.length}>
      {canSlide && (
        <button type="button" className="sf-announce__arrow" onClick={onPrev} aria-label="Previous announcement">
          <Icon name="chevron-left" size={16} />
        </button>
      )}
      <p className="sf-announce__text">
        {active.text}{" "}
        {active.cta && (
          <a className="sf-announce__cta" href={active.cta.href}>
            {active.cta.label}
          </a>
        )}
        {countdownText !== "" && <span className="sf-announce__count">{countdownText}</span>}
      </p>
      {canSlide && (
        <button type="button" className="sf-announce__arrow" onClick={onNext} aria-label="Next announcement">
          <Icon name="chevron-right" size={16} />
        </button>
      )}
      {dismissible && (
        <button type="button" className="sf-announce__dismiss" onClick={onDismiss} aria-label="Dismiss announcement">
          <Icon name="x" size={14} />
        </button>
      )}
      </div>
    </div>
  );
}
