import type { CSSProperties } from "react";
import { Icon, IconButton } from "@/components/ui";
import AnnouncementBar, { type AnnouncementItem } from "./AnnouncementBar";
import MegaMenu from "./MegaMenu";
import NavLinks from "./NavLinks";
import NavLogo from "./NavLogo";
import NavSearchTrigger from "./NavSearchTrigger";
import NavAccountButton from "./NavAccountButton";
import AccountMenu from "./AccountMenu";
import type { AccountMenuModel } from "@/lib/shell/accountMenu";
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
    badge?: boolean;
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
  /** CMS 2.2.0 mega-menu disclosure; open-state is owned by NavbarMount. */
  megaMenu?: { activeLabel?: string | null; onToggle?: (label: string) => void };
  announcement: NavbarAnnouncement;
  /** Live cart region (sf-051): count from the store, onOpen raises the drawer. */
  cart: { count: number; onOpen: () => void; badgeCap?: number };
  account?: { onOpen: () => void; disabled?: boolean };
  /** sf-072: controlled dropdown; open-state and close callback owned by NavbarMount. */
  accountMenu?: { model: AccountMenuModel; open: boolean; onClose: () => void };
  wishlist?: { count: number; onOpen: () => void; disabled?: boolean };
  isMobile: boolean;
  mobileOpen: boolean;
  mobileSide: "left" | "right";
  onMenuOpen: () => void;
  onMenuClose: () => void;
  onSearchOpen: () => void;
  onSearchPreload: () => void;
  /** Machine-owned navigation/status hooks (sf-080). State reaches CSS through
   *  data attrs, never a class swap; both are optional for standalone use. */
  currentHref?: string | null;
  status?: "idle" | "loading" | "ready" | "empty" | "error" | "success";
  className?: string;
}

export default function Navbar({
  regions,
  logo,
  bar,
  colors,
  links,
  megaMenu,
  announcement,
  cart,
  account,
  accountMenu,
  wishlist,
  isMobile,
  mobileOpen,
  mobileSide,
  onMenuOpen,
  onMenuClose,
  onSearchOpen,
  onSearchPreload,
  currentHref,
  status,
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

  // The active label selects the CMS groups; the navbar never carries its own
  // menu content (no prototype copy) and owns no disclosure state.
  const activeLabel = megaMenu?.activeLabel ?? null;
  const megaGroups = activeLabel === null ? [] : links.find((link) => link.label === activeLabel)?.groups ?? [];

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
        data-current={currentHref ?? undefined}
        data-status={status}
        data-mega-open={activeLabel === null ? undefined : "true"}
      >
        {isMobile && (
          <IconButton label="Open menu" onClick={onMenuOpen}>
            <Icon name="menu" size={20} />
          </IconButton>
        )}
        {regions.logo && (
          <NavLogo imageUrl={logo.imageUrl} height={logo.height} wordmark={logo.wordmark} />
        )}
        {regions.links && !isMobile && (
          <NavLinks links={links} activeMegaMenu={activeLabel} onMegaMenuToggle={megaMenu?.onToggle} />
        )}
        <span className="sf-navbar__spacer" aria-hidden="true" />
        <span className="sf-navbar__actions">
          {regions.search && (
            <span onMouseEnter={onSearchPreload} onFocus={onSearchPreload}>
              <NavSearchTrigger onOpen={onSearchOpen} />
            </span>
          )}
          {/* Account opens the sf-072 menu (links + POST sign-out form); the cart
              is live from sf-051 — count from the store, onOpen raises the drawer.
              Never a dead click. */}
          {regions.account && (
            <span className="sf-accountmenu__anchor" data-accountmenu-anchor="true">
              <NavAccountButton
                onAccount={account?.onOpen ?? (() => {})}
                label="Account"
                disabled={account?.disabled ?? false}
              />
              {accountMenu ? (
                <AccountMenu
                  model={accountMenu.model}
                  open={accountMenu.open}
                  onClose={accountMenu.onClose}
                />
              ) : null}
            </span>
          )}
          {regions.wishlist && (
            <NavWishlistButton
              count={wishlist?.count}
              onWishlist={wishlist?.onOpen ?? (() => {})}
              label="Wishlist"
              disabled={wishlist?.disabled ?? false}
            />
          )}
          {regions.cart && (
            <NavCartButton
              count={cart.count}
              badgeCap={cart.badgeCap}
              badgeVisible={regions.badge !== false}
              onCart={cart.onOpen}
              label="Cart"
            />
          )}
        </span>
        {megaGroups.length > 0 ? (
          <MegaMenu
            groups={megaGroups}
            open
            activeLabel={activeLabel ?? undefined}
            className="sf-megamenu--nav"
            options={{ ariaLabel: `${activeLabel ?? ""} menu` }}
          />
        ) : null}
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
