import type { CSSProperties } from "react";
import { Icon, IconButton } from "@/components/ui";
import AnnouncementBar, { type AnnouncementItem } from "./AnnouncementBar";
import NavLinks from "./NavLinks";
import NavLogo from "./NavLogo";
import NavSearchTrigger from "./NavSearchTrigger";
import NavAccountButton from "./NavAccountButton";
import NavWishlistButton from "./NavWishlistButton";
import NavCartButton from "./NavCartButton";
import MobileDrawer from "./MobileDrawer";
import type {
  BarShadow,
  ResolvedNavLink,
  StickyMode,
} from "@/lib/shell/navSettings";

/**
 * Dumb navbar — regions-gated composition of existing shell blocks.
 * Zero state: disclosure (mobile/search) is owned by NavbarMount and
 * arrives as props (controlled-only rule). Paint inlines --nb-* vars;
 * state reaches CSS only through data-* attrs.
 */
export interface NavbarAnnouncement {
  items: AnnouncementItem[];
  showArrows: boolean;
  activeIndex: number;
  countdownText: string;
  dismissible: boolean;
  collapsing: boolean;
  onDismiss: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export interface NavbarProps {
  regions: {
    announcement: boolean;
    logo: boolean;
    links: boolean;
    search: boolean;
    account: boolean;
    wishlist: boolean;
    cart: boolean;
  };
  logo: { imageUrl: string; height: number; wordmark: string };
  bar: { height: number; sticky: StickyMode; shadow: BarShadow; hidden: boolean };
  colors: {
    bg: string;
    text: string;
    hover: string;
    badgeBg: string;
    badgeText: string;
    announceBg: string;
    announceText: string;
  };
  links: ResolvedNavLink[];
  announcement: NavbarAnnouncement;
  isMobile: boolean;
  mobileOpen: boolean;
  mobileSide: "left" | "right";
  onMenuOpen: () => void;
  onMenuClose: () => void;
  onSearchOpen: () => void;
  onSearchPreload: () => void;
  className?: string;
}

export default function Navbar({
  regions,
  logo,
  bar,
  colors,
  links,
  announcement,
  isMobile,
  mobileOpen,
  mobileSide,
  onMenuOpen,
  onMenuClose,
  onSearchOpen,
  onSearchPreload,
  className = "",
}: NavbarProps) {
  // Bar vars ride inline (presentation via props — the resolver owns
  // values; fallbacks mirror DEFAULT_NAV_SETTINGS).
  const barVars = {
    "--nb-bg": colors.bg,
    "--nb-text": colors.text,
    "--nb-hover": colors.hover,
    "--nb-badge-bg": colors.badgeBg,
    "--nb-badge-text": colors.badgeText,
    "--nb-announce-bg": colors.announceBg,
    "--nb-announce-text": colors.announceText,
    "--nb-height": `${bar.height}px`,
  } as CSSProperties;

  return (
    <>
      {regions.announcement && (
        <AnnouncementBar
          items={announcement.items}
          activeIndex={announcement.activeIndex}
          showArrows={announcement.showArrows}
          countdownText={announcement.countdownText}
          dismissible={announcement.dismissible}
          collapsing={announcement.collapsing}
          onDismiss={announcement.onDismiss}
          onPrev={announcement.onPrev}
          onNext={announcement.onNext}
        />
      )}
      <div
        className={`sf-navbar ${className}`}
        style={barVars}
        data-sticky={bar.sticky}
        data-shadow={bar.shadow}
        data-hidden={bar.hidden}
      >
        {isMobile && (
          <IconButton label="Open menu" onClick={onMenuOpen}>
            <Icon name="menu" size={20} />
          </IconButton>
        )}
        {regions.logo && (
          <NavLogo imageUrl={logo.imageUrl} height={logo.height} wordmark={logo.wordmark} />
        )}
        {regions.links && !isMobile && <NavLinks links={links} />}
        <span className="sf-navbar__spacer" aria-hidden="true" />
        <span className="sf-navbar__actions">
          {regions.search && (
            <span onMouseEnter={onSearchPreload} onFocus={onSearchPreload}>
              <NavSearchTrigger onOpen={onSearchOpen} />
            </span>
          )}
          {/* Preview icons (sf-047): present but disabled with coming-soon
              labels — never a dead click. Noops never fire while disabled;
              slices replace them with real handlers. */}
          {regions.account && (
            <NavAccountButton onAccount={() => {}} label="Account (coming soon)" disabled />
          )}
          {regions.wishlist && (
            <NavWishlistButton onWishlist={() => {}} label="Wishlist (coming soon)" disabled />
          )}
          {regions.cart && (
            <NavCartButton onCart={() => {}} label="Cart (coming soon)" disabled />
          )}
        </span>
      </div>
      <MobileDrawer
        open={mobileOpen}
        side={mobileSide}
        links={links}
        onClose={onMenuClose}
      />
    </>
  );
}
