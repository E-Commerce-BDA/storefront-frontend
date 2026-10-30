/**
 * TEMPORARY living showcase (route /components) — scaffolding with an
 * expiry date: DELETE at homepage launch. Not a product surface; do not
 * link it from shop chrome, do not add new sections without a task.
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SearchSheet from "@/components/shell/SearchSheet";
import SearchEditorial from "@/components/shell/SearchEditorial";
import SearchPalette from "@/components/shell/SearchPalette";
import { useSearch } from "@/app/hooks/useSearch";
import { useRecentSearches } from "@/app/hooks/useRecentSearches";
import { useQuickAdd } from "@/app/hooks/useQuickAdd";
import { useSelectOptions } from "@/app/hooks/useSelectOptions";
import { createDemoOptions } from "@/lib/select/demoOptions";
import { createDemoSource, DEMO_CATALOG, DEMO_TRENDING } from "@/lib/search/demoSource";
import { createDemoQuickAdd } from "@/lib/cart/quickAdd";
import { DEFAULT_THEME } from "@/lib/cms/themeSettings";
import { resolveNavSettings } from "@/lib/shell/resolveNav";
import { DEMO_NAV_INPUT } from "@/lib/shell/demoNavInput";
import NavbarMount from "@/app/_components/NavbarMount";
import ProductCard from "@/components/commerce/ProductCard";
import type {
  CtaStyle,
  CtaVariant,
  EyebrowMode,
  HoverMode,
  ImageBlendMode,
  ImageIndicatorStyle,
  ImageNavMode,
  MediaRatio,
  ProductCardData,
  ProductCardType,
  SelectionMode,
  TextAlign,
} from "@/lib/commerce/productCard";

import {
  Button,
  Input,
  Checkbox,
  Radio,
  Toggle,
  Badge,
  IconButton,
  Textarea,
  Select,
  Slider,
  Card,
  Dialog,
  Icon,
  ICON_NAMES,
  Toast,
  Tooltip,
} from "@/components/ui";

const section: React.CSSProperties = { maxWidth: 960, margin: "0 auto", padding: "28px 24px" };

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-8 font-display text-2xl text-[var(--color-ink)]">{children}</h2>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

/**
 * TEMPORARY search-overlay demo (trap vs light feel-test) — lives only in
 * this showcase file, deleted at launch with it. Props-only even here:
 * results arrive as props from the parent's stub filter (hook-era source
 * replaces the stub, not the overlay). Winner becomes production
 * SearchOverlay.tsx; loser is deleted.
 */
interface DemoResult {
  name: string;
  price: string;
}

function SearchDemoOverlay({
  mode,
  query,
  onQueryChange,
  results,
  onClose,
}: {
  mode: "trap" | "light";
  query: string;
  onQueryChange: (q: string) => void;
  results: DemoResult[];
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (mode !== "trap") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const root = rootRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal={mode === "trap"}
      aria-label="Search products (demo)"
      className="fixed inset-0 z-50 flex flex-col items-center px-4 pt-24"
      style={{ background: "rgba(10,37,64,0.72)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close search"
        className="absolute top-5 right-5 inline-flex h-11 w-11 items-center justify-center rounded-full text-white"
        style={{ border: "1px solid rgba(255,255,255,0.4)" }}
      >
        <Icon name="x" size={20} />
      </button>
      <div
        className="flex w-full items-center gap-3 bg-white px-5"
        style={{ maxWidth: 640, borderRadius: 16, boxShadow: "0 16px 64px rgba(0,0,0,0.3)" }}
      >
        <Icon name="search" size={22} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search products… (min 2 chars)"
          aria-label="Search products"
          autoComplete="off"
          className="w-full min-w-0 flex-1 border-0 bg-transparent text-lg text-[var(--color-ink)] outline-0"
          style={{ height: 64 }}
        />
      </div>
      {query.trim().length < 2 ? (
        <p className="mt-4 text-sm text-white">Popular: Linen · Shoes · Jacket — type 2+ characters</p>
      ) : results.length === 0 ? (
        <p className="mt-4 text-sm text-white">No matches for “{query.trim()}”.</p>
      ) : (
        <div className="mt-4 grid w-full gap-3" style={{ maxWidth: 640 }}>
          {results.map((r) => (
            <button
              key={r.name}
              type="button"
              onClick={onClose}
              className="flex items-center justify-between bg-white px-4 py-3 text-left text-sm text-[var(--color-ink)]"
              style={{ borderRadius: 12 }}
            >
              <span className="font-semibold">{r.name}</span>
              <span className="text-[var(--text-muted)]">{r.price}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Local stub catalog for the §13 trap-vs-light feel-test (name/price
// strings — NOT the SearchResult DEMO_CATALOG imported for §16).
const DEMO_STUB_CATALOG: DemoResult[] = [
  { name: "Ocean Linen Shirt", price: "$48" },
  { name: "Court Sneaker", price: "$89" },
  { name: "Trail Runner", price: "$120" },
  { name: "Denim Jacket", price: "$95" },
  { name: "Silk Scarf", price: "$35" },
  { name: "Wool Beanie", price: "$28" },
];


const DEMO_CARD_PRODUCTS: ProductCardData[] = [
  {
    id: "pc-1",
    name: "Ocean Linen Relaxed Shirt",
    price: 48,
    compareAt: 64,
    category: "Apparel",
    brand: { name: "Oceanic Tailors" },
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80",
    hoverImage: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80",
    images: [
      { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80" },
      { url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80" },
      { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80" },
      { url: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=600&q=80" },
    ],
    tag: "Bestseller",
    badges: [
      { key: "sale", label: "Sale 25%", bg: "#e11d48", textColor: "#ffffff" },
      { key: "new", label: "New Arrival", bg: "#0284c7", textColor: "#ffffff" },
      { key: "eco", label: "Eco-Friendly", bg: "#166534", textColor: "#dcfce7", borderColor: "#22c55e", borderStyle: "solid" },
    ],
    options: [
      {
        name: "Color",
        displayType: "swatch",
        showOnCard: true,
        cardPlacement: "brand-hover",
        values: [
          { value: "Sky Blue", swatchHex: "#38bdf8" },
          { value: "Navy", swatchHex: "#1e3a8a" },
          { value: "White", swatchHex: "#ffffff" },
        ],
      },
      {
        name: "Size",
        displayType: "pill",
        showOnCard: true,
        cardPlacement: "media-hover-top",
        values: [{ value: "S" }, { value: "M" }, { value: "L" }, { value: "XL" }],
      },
    ],
    cardVariants: [
      {
        id: "var-1",
        sku: "SHIRT-BLUE-M",
        price: 48,
        compareAtPrice: 64,
        stock: 12,
        imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80",
        optionValues: { Color: "Sky Blue", Size: "M" },
      },
      {
        id: "var-2",
        sku: "SHIRT-NAVY-M",
        price: 52,
        compareAtPrice: 68,
        stock: 5,
        imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
        optionValues: { Color: "Navy", Size: "M" },
      },
      {
        id: "var-3",
        sku: "SHIRT-WHITE-M",
        price: 44,
        compareAtPrice: 58,
        stock: 2,
        imageUrl: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=600&q=80",
        optionValues: { Color: "White", Size: "M" },
      },
    ],
    rating: 4.9,
    ratingCount: 128,
    stock: "in",
  },
  {
    id: "pc-2",
    name: "Minimalist Ceramic Coffee Mug",
    price: 24,
    compareAt: 30,
    category: "Homeware",
    brand: { name: "Nordic Atelier" },
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    images: [
      { url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80" },
      { url: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=600&q=80" },
      { url: "https://images.unsplash.com/photo-1577937927183-b91c0ff471d4?auto=format&fit=crop&w=600&q=80" },
    ],
    tag: "Trending",
    badges: [
      { key: "staff-pick", label: "Staff Pick", bg: "#059669", textColor: "#ffffff" },
    ],
    options: [
      {
        name: "Finish",
        displayType: "swatch",
        showOnCard: true,
        cardPlacement: "media",
        values: [
          { value: "Matte Sand", swatchHex: "#d6c7b2" },
          { value: "Clay", swatchHex: "#a75d43" },
          { value: "Charcoal", swatchHex: "#334155" },
        ],
      },
    ],
    cardVariants: [
      {
        id: "var-mug-1",
        sku: "MUG-SAND",
        price: 24,
        compareAtPrice: 30,
        stock: 18,
        imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
        optionValues: { Finish: "Matte Sand" },
      },
      {
        id: "var-mug-2",
        sku: "MUG-CLAY",
        price: 26,
        compareAtPrice: 32,
        stock: 3,
        imageUrl: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=600&q=80",
        optionValues: { Finish: "Clay" },
      },
      {
        id: "var-mug-3",
        sku: "MUG-CHARCOAL",
        price: 24,
        compareAtPrice: 30,
        stock: 0,
        imageUrl: "https://images.unsplash.com/photo-1577937927183-b91c0ff471d4?auto=format&fit=crop&w=600&q=80",
        optionValues: { Finish: "Charcoal" },
      },
    ],
    rating: 4.7,
    ratingCount: 84,
    stock: "low",
  },
  {
    id: "pc-3",
    name: "Handcrafted Leather Cardholder",
    price: 36,
    category: "Accessories",
    brand: { name: "Studio Crafters" },
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80",
    badges: [
      { key: "limited", label: "Limited Edition", bg: "#7c3aed", textColor: "#f5f3ff", borderColor: "#a855f7", borderStyle: "dashed" },
    ],
    rating: 5.0,
    ratingCount: 42,
    stock: "out",
  },
];

export default function PreviewPage() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [agree, setAgree] = useState(false);
  const [notify, setNotify] = useState(true);
  const [ship, setShip] = useState("flat");
  const [radius, setRadius] = useState(8);
  const [dialogOpen, setDialogOpen] = useState(false);
  // §19 ProductCard showcase state
  const [pcCardType, setPcCardType] = useState<ProductCardType>("standard");
  const [pcRatio, setPcRatio] = useState<MediaRatio>("4:5");
  const [pcRadius, setPcRadius] = useState(12);
  const [pcImageRadius, setPcImageRadius] = useState(8);
  const [pcPad, setPcPad] = useState(12);
  const [pcBlend, setPcBlend] = useState<ImageBlendMode>("normal");
  const [pcHover, setPcHover] = useState<HoverMode>("actions");
  const [pcShowBadge, setPcShowBadge] = useState(true);
  const [pcBadgePos, setPcBadgePos] = useState<"left" | "right">("left");
  const [pcShowRatings, setPcShowRatings] = useState(true);
  const [pcShowDept, setPcShowDept] = useState(true);
  const [pcCardBg, setPcCardBg] = useState("");
  const [pcBorderColor, setPcBorderColor] = useState("");
  const [pcTextColor, setPcTextColor] = useState("");
  const [pcPriceColor, setPcPriceColor] = useState("");
  const [pcTextAlign, setPcTextAlign] = useState<TextAlign>("left");
  const [pcCtaVariant, setPcCtaVariant] = useState<CtaVariant>("overlay");
  const [pcCtaStyle, setPcCtaStyle] = useState<CtaStyle>("icon");
  const [pcShowSwatches, setPcShowSwatches] = useState(true);
  const [pcShowPills, setPcShowPills] = useState(true);
  const [pcEyebrow, setPcEyebrow] = useState<EyebrowMode>("category");
  const [pcImageNav, setPcImageNav] = useState<ImageNavMode>("hover");
  const [pcImageIndicator, setPcImageIndicator] = useState<ImageIndicatorStyle>("dots");
  const [pcSelectionMode, setPcSelectionMode] = useState<SelectionMode>("preview");
  const [pcActiveImageIdx, setPcActiveImageIdx] = useState(0);
  const [pcPreviewedOptions, setPcPreviewedOptions] = useState<Record<string, string> | null>(null);
  const [pcOptPlacementColor, setPcOptPlacementColor] = useState<"brand-hover" | "info" | "media">("brand-hover");
  const [pcOptPlacementSize, setPcOptPlacementSize] = useState<"media-hover-top" | "info" | "media">("media-hover-top");
  const [pcSelectedOptions, setPcSelectedOptions] = useState<Record<string, string>>({
    Color: "Sky Blue",
    Size: "M",
    Finish: "Clay",
  });

  const [searchMode, setSearchMode] = useState<"trap" | "light">("trap");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchSource = useMemo(() => createDemoSource(), []);
  const paletteQuickAddPort = useMemo(() => createDemoQuickAdd(), []);
  // §18 navbar demo resolves its OWN nav (never shares the layout
  // chrome's object — same own-instance rule as the overlay demos).
  const demoNav = useMemo(() => resolveNavSettings({ settings: DEMO_NAV_INPUT, global: null }), []);
  // §9 select demos run their OWN options hook (never share list state —
  // same own-instance rule as the overlay demos).
  const demoOptionsSource = useMemo(() => createDemoOptions(), []);
  const asyncCountries = useSelectOptions(demoOptionsSource);
  const [asyncCountry, setAsyncCountry] = useState("");
  const [themedCountry, setThemedCountry] = useState("de");
  const liveSearch = useSearch(searchSource);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetActive, setSheetActive] = useState(0);
  const [sheetClosing, setSheetClosing] = useState(false);
  const sheetDepartments = useMemo(
    () => ["All", "Shirts", "Pants", "Outerwear", "Footwear", "Accessories"],
    [],
  );
  // Editorial runs its OWN hook instance (never shares liveSearch state —
  // the §14 sheet demo and this takeover stay independently drivable).
  const editorialSearch = useSearch(searchSource);
  const [edOpen, setEdOpen] = useState(false);
  const [edActive, setEdActive] = useState(0);
  const [edClosing, setEdClosing] = useState(false);
  // Photo tabs (no Accessories — the curated season has five rails).
  const edDepartments = useMemo(() => ["All", "Shirts", "Pants", "Outerwear", "Footwear"], []);

  // Demo-grade two-phase closes (mirror HomeChrome pattern): closing class
  // plays the exit, unmount follows after the motion duration. Instant
  // under reduced-motion. Durations match each variant's builtin default.
  function prefersInstant() {
    return (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }
  function closeSheetDemo() {
    if (prefersInstant()) {
      setSheetOpen(false);
      return;
    }
    setSheetClosing(true);
    setTimeout(() => {
      setSheetOpen(false);
      setSheetClosing(false);
    }, 240);
  }
  function closeEditorialDemo() {
    // 320ms = oceanic builtin (the editorial default); keep beside the
    // knob, not magic — if the default changes, this follows.
    if (prefersInstant()) {
      setEdOpen(false);
      return;
    }
    setEdClosing(true);
    setTimeout(() => {
      setEdOpen(false);
      setEdClosing(false);
    }, 320);
  }
  // Palette runs its OWN hook trio (never shares sheet/editorial state —
  // all three demos stay independently drivable on one page).
  const paletteSearch = useSearch(searchSource);
  const paletteRecents = useRecentSearches();
  const paletteQuickAdd = useQuickAdd(paletteQuickAddPort);
  const [palOpen, setPalOpen] = useState(false);
  const [palActive, setPalActive] = useState(0);
  const [palClosing, setPalClosing] = useState(false);
  function closePaletteDemo() {
    // 320ms = oceanic builtin (the palette default).
    if (prefersInstant()) {
      setPalOpen(false);
      return;
    }
    setPalClosing(true);
    setTimeout(() => {
      setPalOpen(false);
      setPalClosing(false);
    }, 320);
  }
  // Notify demo (notifyOnQuickAdd default on): Toast follows addedIds,
  // auto-dismisses in 3s. Production assembler owns the same effect —
  // the Toast holds no timers itself.
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const addedCountRef = useRef(0);
  useEffect(() => {
    if (paletteQuickAdd.addedIds.length > addedCountRef.current) {
      const id = paletteQuickAdd.addedIds[paletteQuickAdd.addedIds.length - 1];
      const row = DEMO_CATALOG.find((p) => p.id === id);
      setToast({ title: "Added to bag", message: row ? row.name : "" });
      const t = setTimeout(() => setToast(null), 3000);
      addedCountRef.current = paletteQuickAdd.addedIds.length;
      return () => clearTimeout(t);
    }
    addedCountRef.current = paletteQuickAdd.addedIds.length;
    return undefined;
  }, [paletteQuickAdd.addedIds]);

  return (
    <div className="min-h-screen">
      <header className="bg-[var(--color-ink)] p-4 text-center text-white">
        Storefront Base Components — Oceanic Blue v1.0 (preview)
      </header>

      <main style={section}>
        <p className="text-sm text-[var(--text-muted)]">
          Dumb components from <code>components/ui</code>. All state lives here (controlled-only). Hover
          buttons to see the wave.
        </p>

        <H2>1. Button — 6 variants + CMS override</H2>
        <Card>
          <div className="grid gap-3">
            <Row>
              <Button>Primary</Button>
              <Button variant="light">Light</Button>
              <Button variant="ghost-ink">Ghost ink (admin)</Button>
              <Button variant="sale">Sale −30%</Button>
              <Button variant="success">Success</Button>
              <Button variant="error">Error</Button>
            </Row>
            <Row>
              <Button size="sm">Small 36px</Button>
              <Button size="lg">Large 52px</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </Row>
            <Row>
              <Button bg="#111111" textColor="#ffffff" borderColor="#111111" borderRadius={6}>
                CMS CTA: Shop now
              </Button>
              <Button href="/#preview">Link button</Button>
            </Row>
            <Row>
              <Button animation={{ peaks: 1 }}>Peak 1</Button>
              <Button animation={{ peaks: 3 }}>Peaks 3</Button>
              <Button animation={{ waveOrigin: "left" }}>Rise left</Button>
              <Button animation={{ animationKind: "fade" }}>Fade</Button>
              <Button hoverBorderColor="#023E8A">Custom hover border</Button>
            </Row>
            <Row>
              {/* House-style proof (sf-038): theme object alone retunes an
                  uncustomized button — sale variant + lg via theme. */}
              <Button
                theme={{ ...DEFAULT_THEME.button, defaultVariant: "sale", defaultSize: "lg" }}
              >
                House style via theme
              </Button>
            </Row>
          </div>
        </Card>

        <H2>2. Input — controlled</H2>
        <Card>
          <div className="grid max-w-[520px] gap-3">
            <Input label="Name" value={name} onChange={setName} placeholder="Jane Doe" helper={`Typed: ${name || "—"}`} required />
            <Input label="Search products" value={name} onChange={setName} size="sm" placeholder="min 2 chars…" />
            <Input label="Email (error demo)" value="bad@" onChange={() => {}} error="Enter a valid email" />
          </div>
        </Card>

        <H2>3. Checkbox — controlled</H2>
        <Card>
          <div className="grid max-w-[520px] gap-2">
            <Checkbox checked={agree} onChange={setAgree} label="I agree to terms" helper="Required at checkout" />
            <Checkbox checked onChange={() => {}} label="Checked (accent fill)" />
            <Checkbox checked={false} onChange={() => {}} label="Indeterminate" indeterminate />
            <Checkbox checked={false} onChange={() => {}} label="Invalid" error="You must accept" />
            <p className="text-[13px] text-[var(--text-muted)]">agree = {String(agree)}</p>
          </div>
        </Card>

        <H2>4. Radio — controlled group</H2>
        <Card>
          <div className="grid max-w-[520px] gap-2">
            <Radio name="ship" value="flat" checked={ship === "flat"} onChange={setShip} label="Flat rate ($5.00)" />
            <Radio name="ship" value="express" checked={ship === "express"} onChange={setShip} label="Express ($12.00)" />
            <Radio name="ship" value="pickup" checked={ship === "pickup"} onChange={setShip} label="Pickup (free)" disabled />
            <p className="text-[13px] text-[var(--text-muted)]">ship = {ship}</p>
          </div>
        </Card>

        <H2>5. Toggle — controlled switch</H2>
        <Card>
          <div className="grid max-w-[520px] gap-2">
            <Toggle checked={notify} onChange={setNotify} label="Email notifications" />
            <Toggle checked={agree} onChange={setAgree} label="Marketing (left label)" labelPosition="left" helper="Off by default" />
            <Toggle checked={false} onChange={() => {}} label="Disabled on" disabled />
            <p className="text-[13px] text-[var(--text-muted)]">notify = {String(notify)}</p>
          </div>
        </Card>

        <H2>6. Badge</H2>
        <Card>
          <Row>
            <Badge tone="sale">SALE −30%</Badge>
            <Badge tone="success">In stock</Badge>
            <Badge tone="warning">Low stock</Badge>
            <Badge tone="error">COUPON_EXPIRED</Badge>
            <Badge tone="info">New</Badge>
            <Badge tone="neutral">Draft</Badge>
          </Row>
        </Card>

        <H2>7. IconButton + Icons (lucide, currentColor)</H2>
        <Card>
          <Row>
            <IconButton label="Search">
              <Icon name="search" />
            </IconButton>
            <IconButton label="Cart">
              <Icon name="shopping-bag" />
            </IconButton>
            <IconButton label="Close">
              <Icon name="x" />
            </IconButton>
            <IconButton label="Wishlist">
              <Icon name="heart" filled />
            </IconButton>
            <IconButton label="Previous slide">
              <Icon name="chevron-left" />
            </IconButton>
            <IconButton label="Next slide">
              <Icon name="chevron-right" />
            </IconButton>
          </Row>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Full set at 20px on white, then on ink (icons follow text color — dark on white, white on
            dark, no color props):
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {ICON_NAMES.map((name) => (
              <span
                key={name}
                title={name}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--color-ink)]"
              >
                <Icon name={name} />
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl bg-[var(--color-ink)] p-3 text-white">
            {ICON_NAMES.map((name) => (
              <span key={name} title={name} className="inline-flex items-center justify-center">
                <Icon name={name} />
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-4 text-[var(--color-ink)]">
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">16</span>
            <Icon name="star" size={16} filled />
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">20</span>
            <Icon name="star" filled />
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">24</span>
            <Icon name="star" size={24} filled />
          </div>
        </Card>

        <H2>8. Textarea</H2>
        <Card>
          <div className="grid max-w-[520px] gap-3">
            <Textarea label="Bio" value={bio} onChange={setBio} placeholder="Tell us about yourself…" rows={4} helper="Max 200 chars" />
            <Textarea label="Error demo" value="x" onChange={() => {}} error="Too short" />
          </div>
        </Card>

        <H2>9. Select</H2>
        <Card>
          <div className="grid max-w-[520px] gap-3">
            <Select
              label="Country"
              value={country}
              onChange={setCountry}
              placeholder="Select country…"
              options={[
                { value: "us", label: "United States" },
                { value: "uk", label: "United Kingdom" },
                { value: "de", label: "Germany" },
              ]}
              helper="Shipping destination"
            />
            <Select label="Error demo" value="" onChange={() => {}} options={[]} error="Required field" />
            <Select
              label="Country (async custom)"
              value={asyncCountry}
              onChange={setAsyncCountry}
              placeholder={asyncCountries.status === "loading" ? "Loading countries…" : "Select country…"}
              options={asyncCountries.options}
              variant="custom"
              helper={`Port status: ${asyncCountries.status} (stale-killed, unmount-safe)`}
            />
            <Select
              label="Country (themed custom, instant)"
              value={themedCountry}
              onChange={setThemedCountry}
              placeholder="Select country…"
              options={asyncCountries.options}
              variant="custom"
              listTheme={{ selectedBg: "#0077b6", selectedText: "#ffffff", hoverBg: "#e6f7fb", optionPaddingY: 10 }}
              listMotion={{ enabled: false, durationMs: 180, easing: "ease-out", travel: "minimal" }}
              helper="Custom faces + animation off via props (theme feeds at the owner)"
            />
          </div>
        </Card>

        <H2>10. Slider (CMS numeric settings)</H2>
        <Card>
          <div className="grid max-w-[520px] gap-3">
            <Slider label="Border radius" value={radius} min={0} max={24} onChange={setRadius} showValue helper="CMS theme.borderRadius.button 0–24" />
            <Row>
              <Button borderRadius={radius}>Radius {radius}px live</Button>
            </Row>
          </div>
        </Card>

        <H2>11. Card + Dialog</H2>
        <Card title="Card title" action={<Badge tone="info">Preview</Badge>}>
          <p className="text-sm text-[var(--text-muted)]">Cards wrap preview sections. Dialogs confirm destructive actions.</p>
          <div className="mt-3">
            <Button variant="error" onClick={() => setDialogOpen(true)}>
              Delete product…
            </Button>
          </div>
        </Card>
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Delete product?">
          <p className="text-sm text-[var(--text-muted)]">This is a dumb confirm dialog. Parent owns open state.</p>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="light" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="error" onClick={() => setDialogOpen(false)}>
              Delete
            </Button>
          </div>
        </Dialog>

        <H2>12. Tooltip — image, dots, disabled reason, icon</H2>
        <Card>
          <div className="grid gap-6">
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--color-ink)]">
                Product image — hover shows the product name
              </p>
              <Tooltip mode="product-name" productName="Ocean Linen Shirt — $48.00" placement="top">
                <span
                  className="flex h-40 w-56 items-center justify-center rounded-xl text-sm font-medium text-[var(--text-muted)]"
                  style={{ background: "linear-gradient(135deg,#E6F7FB,#CAF0F8)" }}
                >
                  Product image
                </span>
              </Tooltip>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--color-ink)]">
                Pagination dots — hover a dot, position reads below (“2 of 3”)
              </p>
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <Tooltip key={i} mode="position" index={i} total={3} placement="bottom">
                    <button
                      type="button"
                      aria-label={`Go to slide ${i + 1}`}
                      className="h-2 w-2 rounded-full"
                      style={{ background: "var(--color-ink)", opacity: i === 1 ? 1 : 0.3 }}
                    />
                  </Tooltip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--color-ink)]">
                Disabled button — hover explains why (no wave, no swap)
              </p>
              <Row>
                <Tooltip content="Out of stock in this size" placement="top">
                  <Button disabled>Sold out</Button>
                </Tooltip>
                <Tooltip content="Search products" placement="top">
                  <IconButton label="Search">
                    <Icon name="search" />
                  </IconButton>
                </Tooltip>
              </Row>
            </div>
          </div>
        </Card>

        <H2>13. Search overlay demo — trap vs light (temporary)</H2>
        <Card>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            Same overlay content, one variable isolated. Trap: Tab cycles inside. Light: autofocus + Esc only,
            Tab escapes to the page. Feel both, then pick the production behavior.
          </p>
          <Row>
            <Button
              variant={searchMode === "trap" ? "primary" : "light"}
              onClick={() => setSearchMode("trap")}
            >
              Trap
            </Button>
            <Button
              variant={searchMode === "light" ? "primary" : "light"}
              onClick={() => setSearchMode("light")}
            >
              Light dismiss
            </Button>
            <Button
              onClick={(e) => {
                searchTriggerRef.current = e.currentTarget;
                setSearchQuery("");
                setSearchOpen(true);
              }}
            >
              Open search demo
            </Button>
          </Row>
        </Card>

        <H2>14. Search sheet V2 — live overlay variant</H2>
        <Card>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            Production <code>SearchSheet</code> wired to <code>useSearch</code> + demo source (locked discipline:
            300ms debounce, min-2 gate, stale-kill). Trap + Esc + focus return. Type 2+ characters, filter by
            department, cycle with arrow keys.
          </p>
          <Row>
            <Button
              onClick={() => {
                liveSearch.setQuery("");
                liveSearch.setDept("All");
                setSheetActive(0);
                setSheetClosing(false);
                setSheetOpen(true);
              }}
            >
              Open search sheet
            </Button>
          </Row>
        </Card>

        <H2>15. Search overlay variants index</H2>
        <Card>
          <div className="grid gap-2 text-sm">
            <p className="m-0 text-[var(--color-ink)]">
              <b>Classic</b> <span className="text-[var(--text-muted)]">— §13 feel-test behavior (trap won, kept as fallback)</span>
            </p>
            <p className="m-0 text-[var(--color-ink)]">
              <b>Palette modal</b> <span className="text-[var(--color-ink)]">— live below (§17): modal, filter Pills, trending + recent, quick-add</span>
            </p>
            <p className="m-0 text-[var(--color-ink)]">
              <b>Sheet</b> <span className="text-[var(--text-muted)]">— live above (§14): slide-down panel, departments, cards</span>
            </p>
            <p className="m-0 text-[var(--color-ink)]">
              <b>Editorial takeover</b> <span className="text-[var(--text-muted)]">— live below (§16): scrollable takeover, serif input, curated grid</span>
            </p>
            <p className="m-0 text-[var(--color-ink)]">
              <b>Inspect split</b> <span className="text-[var(--text-muted)]">— coming: hover inspect, lazy preview, size select</span>
            </p>
            <p className="m-0 text-[13px] text-[var(--text-muted)]">
              Admin picks one via <code>search.overlayVariant</code>; only the selected variant ships (registry
              dynamic-imports, build output proves the rest absent).
            </p>
          </div>
        </Card>

        <H2>16. Search editorial — live takeover variant</H2>
        <Card>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            Production <code>SearchEditorial</code> on its own <code>useSearch</code> instance + demo source
            (same locked discipline: 300ms debounce, min-2 gate, stale-kill). Empty query shows the curated
            grid; 2+ characters switch to live results. Trap + Esc + focus return, oceanic arrival.
          </p>
          <Row>
            <Button
              onClick={() => {
                editorialSearch.setQuery("");
                editorialSearch.setDept("All");
                setEdActive(0);
                setEdClosing(false);
                setEdOpen(true);
              }}
            >
              Open editorial search
            </Button>
          </Row>
        </Card>

        <H2>17. Search palette — live modal variant</H2>
        <Card>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            Production <code>SearchPalette</code> on its own hook trio (<code>useSearch</code> +{" "}
            <code>useRecentSearches</code> + <code>useQuickAdd</code> over demo ports). Empty query shows
            trending + recent + curated rows; selecting pushes to recents; Quick Add flips to Added via the
            hook. Trap + Esc + focus return, oceanic arrival.
          </p>
          <Row>
            <Button
              onClick={() => {
                paletteSearch.setQuery("");
                paletteSearch.setDept("All");
                setPalActive(0);
                setPalClosing(false);
                setPalOpen(true);
              }}
            >
              Open palette search
            </Button>
          </Row>
        </Card>

        <H2>18. Navbar — live chrome mount (demo instance)</H2>
        <Card>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            Production <code>NavbarMount</code> on demo-resolved settings —
            own mount instance (never shares state with the layout chrome
            above). Announcement, links, search overlay and drawer all live.
            Production mounts once in <code>app/layout.tsx</code>.
          </p>
          <NavbarMount nav={demoNav} />
        </Card>

        <H2>19. ProductCard — commerce face (all variants + interactive customizations)</H2>
        <Card>
          <p className="mb-4 text-sm text-[var(--text-muted)]">
            Customizable commerce face: aspect ratio, 5 card types, independent card and image radii,
            CSS image blend modes (e.g. <code>multiply</code> for packshot cutouts), centralized badge registry &amp; toggles,
            color customization with automatic contrast safety, CTA bar placements/styles, and option swatches/pills.
            Completely controlled, dumb <code>props &rarr; JSX</code>.
          </p>

          <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--color-section-bg)] p-4">
            <h3 className="mb-3 font-semibold text-[var(--color-ink)]">Interactive Customization Playground</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Card Type</label>
                <select
                  value={pcCardType}
                  onChange={(e) => setPcCardType(e.target.value as ProductCardType)}
                  className="w-full rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                >
                  <option value="standard">standard</option>
                  <option value="minimal">minimal</option>
                  <option value="compact">compact</option>
                  <option value="overlay">overlay</option>
                  <option value="horizontal">horizontal</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Aspect Ratio</label>
                <select
                  value={pcRatio}
                  onChange={(e) => setPcRatio(e.target.value as MediaRatio)}
                  className="w-full rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                >
                  <option value="1:1">1:1 (Square)</option>
                  <option value="3:4">3:4 (Portrait)</option>
                  <option value="4:5">4:5 (Editorial)</option>
                  <option value="4:3">4:3 (Landscape)</option>
                  <option value="16:9">16:9 (Wide)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">CTA Placement</label>
                <select
                  value={pcCtaVariant}
                  onChange={(e) => setPcCtaVariant(e.target.value as CtaVariant)}
                  className="w-full rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                >
                  <option value="overlay">overlay (on media hover)</option>
                  <option value="below">below (under media)</option>
                  <option value="inline">inline (next to price)</option>
                  <option value="footer">footer (pinned at card bottom)</option>
                  <option value="none">none (hidden)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">CTA Style</label>
                <select
                  value={pcCtaStyle}
                  onChange={(e) => setPcCtaStyle(e.target.value as CtaStyle)}
                  className="w-full rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                >
                  <option value="icon">icon (circular quick actions)</option>
                  <option value="label">label (text button)</option>
                  <option value="icon-label">icon-label (full action button)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Image Blend Mode</label>
                <select
                  value={pcBlend}
                  onChange={(e) => setPcBlend(e.target.value as ImageBlendMode)}
                  className="w-full rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                >
                  <option value="normal">normal</option>
                  <option value="multiply">multiply (blend white cutout)</option>
                  <option value="darken">darken</option>
                  <option value="overlay">overlay</option>
                  <option value="screen">screen</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Hover Mode</label>
                <select
                  value={pcHover}
                  onChange={(e) => setPcHover(e.target.value as HoverMode)}
                  className="w-full rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                >
                  <option value="actions">actions (reveal CTA)</option>
                  <option value="image">image (secondary swap)</option>
                  <option value="zoom">zoom (scale cover)</option>
                  <option value="none">none (static)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Text Align</label>
                <select
                  value={pcTextAlign}
                  onChange={(e) => setPcTextAlign(e.target.value as TextAlign)}
                  className="w-full rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                >
                  <option value="left">left</option>
                  <option value="center">center</option>
                  <option value="right">right</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Card Radius: {pcRadius}px</label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={pcRadius}
                  onChange={(e) => setPcRadius(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Image Radius: {pcImageRadius}px</label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={pcImageRadius}
                  onChange={(e) => setPcImageRadius(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Card Padding: {pcPad}px</label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={pcPad}
                  onChange={(e) => setPcPad(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Card Background</label>
                <div className="flex items-center gap-2">
                  <select
                    value={pcCardBg}
                    onChange={(e) => setPcCardBg(e.target.value)}
                    className="flex-1 rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                  >
                    <option value="">transparent / default</option>
                    <option value="#FFFFFF">#FFFFFF (White)</option>
                    <option value="#F8FAFC">#F8FAFC (Slate Light)</option>
                    <option value="#E6F7FB">#E6F7FB (Ocean Foam)</option>
                    <option value="#0A2540">#0A2540 (Abyss Dark)</option>
                    <option value="#18181B">#18181B (Zinc Dark)</option>
                  </select>
                  <input
                    type="color"
                    aria-label="Pick Card Background"
                    value={pcCardBg.startsWith("#") && pcCardBg.length === 7 ? pcCardBg : "#ffffff"}
                    onChange={(e) => setPcCardBg(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-[var(--border)] p-0.5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Border Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. #e2e8f0"
                    value={pcBorderColor}
                    onChange={(e) => setPcBorderColor(e.target.value)}
                    className="flex-1 rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                  />
                  <input
                    type="color"
                    aria-label="Pick Border Color"
                    value={pcBorderColor.startsWith("#") && pcBorderColor.length === 7 ? pcBorderColor : "#e2e8f0"}
                    onChange={(e) => setPcBorderColor(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-[var(--border)] p-0.5"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Eyebrow Mode</label>
                <select
                  value={pcEyebrow}
                  onChange={(e) => setPcEyebrow(e.target.value as EyebrowMode)}
                  className="w-full rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                >
                  <option value="category">category (Apparel)</option>
                  <option value="brand">brand (Oceanic Tailors)</option>
                  <option value="none">none (hidden)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Image Carousel Nav</label>
                <select
                  value={pcImageNav}
                  onChange={(e) => setPcImageNav(e.target.value as ImageNavMode)}
                  className="w-full rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                >
                  <option value="hover">hover (arrows on card hover)</option>
                  <option value="always">always (always visible)</option>
                  <option value="touch">touch (on touch devices)</option>
                  <option value="none">none (no arrows)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Image Indicator</label>
                <select
                  value={pcImageIndicator}
                  onChange={(e) => setPcImageIndicator(e.target.value as ImageIndicatorStyle)}
                  className="w-full rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                >
                  <option value="dots">dots</option>
                  <option value="bars">bars</option>
                  <option value="count">count (1 / 4)</option>
                  <option value="none">none</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Selection Mode</label>
                <select
                  value={pcSelectionMode}
                  onChange={(e) => setPcSelectionMode(e.target.value as SelectionMode)}
                  className="w-full rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                >
                  <option value="preview">preview (hover previews, click commits)</option>
                  <option value="commit-only">commit-only (click only)</option>
                  <option value="visual">visual (visual swatch selection)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Color Swatch Slot</label>
                <select
                  value={pcOptPlacementColor}
                  onChange={(e) => setPcOptPlacementColor(e.target.value as "brand-hover" | "info" | "media")}
                  className="w-full rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                >
                  <option value="brand-hover">brand-hover (replaces brand on hover)</option>
                  <option value="info">info (standard info block)</option>
                  <option value="media">media (bottom media overlay)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-[var(--text-muted)]">Size Pill Slot</label>
                <select
                  value={pcOptPlacementSize}
                  onChange={(e) => setPcOptPlacementSize(e.target.value as "media-hover-top" | "info" | "media")}
                  className="w-full rounded border border-[var(--border)] bg-white px-2 py-1 text-sm text-[var(--color-ink)]"
                >
                  <option value="media-hover-top">media-hover-top (floats top on hover)</option>
                  <option value="info">info (standard info block)</option>
                  <option value="media">media (bottom media overlay)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                  <input type="checkbox" checked={pcShowBadge} onChange={(e) => setPcShowBadge(e.target.checked)} />
                  Show Badges
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                  <input type="checkbox" checked={pcShowRatings} onChange={(e) => setPcShowRatings(e.target.checked)} />
                  Show Ratings
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                  <input type="checkbox" checked={pcShowDept} onChange={(e) => setPcShowDept(e.target.checked)} />
                  Show Department / Eyebrow
                </label>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                  <input type="checkbox" checked={pcShowSwatches} onChange={(e) => setPcShowSwatches(e.target.checked)} />
                  Show Color Swatches
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                  <input type="checkbox" checked={pcShowPills} onChange={(e) => setPcShowPills(e.target.checked)} />
                  Show Size Pills
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--text-muted)]">Badge Pos:</span>
                  <button
                    type="button"
                    onClick={() => setPcBadgePos(pcBadgePos === "left" ? "right" : "left")}
                    className="rounded border border-[var(--border)] bg-white px-2 py-0.5 text-xs font-medium text-[var(--color-ink)]"
                  >
                    {pcBadgePos}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center">
              <span className="mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">Live Interactive Preview</span>
              <div className="w-full max-w-[320px]">
                <ProductCard
                  product={{
                    ...DEMO_CARD_PRODUCTS[0],
                    options: DEMO_CARD_PRODUCTS[0].options?.map((opt) => {
                      if (opt.name === "Color") return { ...opt, cardPlacement: pcOptPlacementColor };
                      if (opt.name === "Size") return { ...opt, cardPlacement: pcOptPlacementSize };
                      return opt;
                    }),
                  }}
                  cardType={pcCardType}
                  mediaRatio={pcRatio}
                  borderRadius={pcRadius}
                  imageBorderRadius={pcImageRadius}
                  cardPad={pcPad}
                  imageBlendMode={pcBlend}
                  hoverMode={pcHover}
                  showBadge={pcShowBadge}
                  badgePosition={pcBadgePos}
                  showRatings={pcShowRatings}
                  showDept={pcShowDept}
                  eyebrow={pcEyebrow}
                  imageNav={pcImageNav}
                  imageIndicator={pcImageIndicator}
                  selectionMode={pcSelectionMode}
                  activeImageIndex={pcActiveImageIdx}
                  onImageIndexChange={setPcActiveImageIdx}
                  previewedOptions={pcPreviewedOptions}
                  onPreviewOption={(name, val) =>
                    setPcPreviewedOptions(val ? { [name]: val } : null)
                  }
                  cardBg={pcCardBg || undefined}
                  borderColor={pcBorderColor || (pcCardBg ? "var(--border)" : "transparent")}
                  textColor={pcTextColor || undefined}
                  priceColor={pcPriceColor || undefined}
                  textAlign={pcTextAlign}
                  ctaVariant={pcCtaVariant}
                  ctaStyle={pcCtaStyle}
                  showSwatches={pcShowSwatches}
                  showPills={pcShowPills}
                  selectedOptions={pcSelectedOptions}
                  onSelectOption={(name, val) =>
                    setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                  }
                />
              </div>
            </div>
          </div>

          <h3 className="mb-3 font-semibold text-[var(--color-ink)]">All 5 Card Type Variants Side-by-Side</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">1. Standard</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[0]}
                cardType="standard"
                mediaRatio="4:5"
                borderRadius={12}
                imageBorderRadius={12}
                ctaVariant="overlay"
                selectedOptions={pcSelectedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">2. Minimal</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[1]}
                cardType="minimal"
                mediaRatio="4:5"
                borderRadius={8}
                imageBorderRadius={8}
                ctaVariant="overlay"
                selectedOptions={pcSelectedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">3. Compact</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[0]}
                cardType="compact"
                mediaRatio="1:1"
                borderRadius={6}
                imageBorderRadius={6}
                cardPad={8}
                cardBg="var(--color-card, #ffffff)"
                borderColor="var(--border)"
                ctaVariant="overlay"
                selectedOptions={pcSelectedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">4. Overlay (Cinematic)</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[0]}
                cardType="overlay"
                mediaRatio="3:4"
                borderRadius={16}
                imageBorderRadius={16}
                ctaVariant="overlay"
                selectedOptions={pcSelectedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">5. Horizontal (Row / Drawer)</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[1]}
                cardType="horizontal"
                mediaRatio="1:1"
                borderRadius={12}
                imageBorderRadius={12}
                cardPad={12}
                cardBg="var(--color-card, #ffffff)"
                borderColor="var(--border)"
                ctaVariant="below"
                selectedOptions={pcSelectedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
              />
            </div>
          </div>

          <h3 className="mb-3 mt-8 font-semibold text-[var(--color-ink)]">CTA Action Bar Variants &amp; Styles</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Below Media (Full Action Button)</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[0]}
                cardType="standard"
                mediaRatio="4:5"
                ctaVariant="below"
                ctaStyle="icon-label"
                borderRadius={12}
                imageBorderRadius={10}
                selectedOptions={pcSelectedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Inline With Price (Label Button)</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[1]}
                cardType="standard"
                mediaRatio="4:5"
                ctaVariant="inline"
                ctaStyle="label"
                borderRadius={12}
                imageBorderRadius={10}
                selectedOptions={pcSelectedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Pinned Footer (Solid Border)</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[2]}
                cardType="standard"
                mediaRatio="4:5"
                ctaVariant="footer"
                ctaStyle="icon-label"
                borderRadius={12}
                imageBorderRadius={10}
                cardBg="#ffffff"
                borderColor="var(--border)"
                cardPad={12}
                selectedOptions={pcSelectedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
              />
            </div>
          </div>

          <h3 className="mb-3 mt-8 font-semibold text-[var(--color-ink)]">Centralized Badges &amp; Auto-Contrast Dark Surface</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Centralized Badge Registry (Multi-Badge Stack + Swatches)</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[0]}
                cardType="standard"
                mediaRatio="4:5"
                badgePosition="left"
                ctaVariant="below"
                borderRadius={12}
                imageBorderRadius={10}
                selectedOptions={pcSelectedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Dark Theme Auto-Contrast (#0A2540 Abyss Dark)</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[0]}
                cardType="standard"
                mediaRatio="4:5"
                cardBg="#0A2540"
                borderColor="#1E3A8A"
                cardPad={12}
                borderRadius={12}
                imageBorderRadius={10}
                ctaVariant="below"
                ctaStyle="icon-label"
                selectedOptions={pcSelectedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
              />
            </div>
          </div>

          <h3 className="mb-3 mt-8 font-semibold text-[var(--color-ink)]">Multi-Image Carousel with Sibling Arrows &amp; Indicators</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Dots Indicator (Hover Arrows)</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[0]}
                cardType="standard"
                mediaRatio="4:5"
                imageNav="hover"
                imageIndicator="dots"
                borderRadius={12}
                imageBorderRadius={10}
                activeImageIndex={pcActiveImageIdx}
                onImageIndexChange={setPcActiveImageIdx}
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Segmented Bars (Always Arrows)</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[1]}
                cardType="standard"
                mediaRatio="4:5"
                imageNav="always"
                imageIndicator="bars"
                borderRadius={12}
                imageBorderRadius={10}
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Slide Counter Badge (1 / 4)</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[0]}
                cardType="standard"
                mediaRatio="4:5"
                imageNav="hover"
                imageIndicator="count"
                borderRadius={12}
                imageBorderRadius={10}
              />
            </div>
          </div>

          <h3 className="mb-3 mt-8 font-semibold text-[var(--color-ink)]">Configurable Option Placements (brand-hover &amp; media-hover-top)</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">brand-hover (Swatches replace brand on hover)</span>
              <ProductCard
                product={{
                  ...DEMO_CARD_PRODUCTS[0],
                  options: [
                    {
                      name: "Color",
                      displayType: "swatch",
                      showOnCard: true,
                      cardPlacement: "brand-hover",
                      values: [
                        { value: "Sky Blue", swatchHex: "#38bdf8" },
                        { value: "Navy", swatchHex: "#1e3a8a" },
                        { value: "White", swatchHex: "#ffffff" },
                      ],
                    },
                  ],
                }}
                cardType="standard"
                eyebrow="brand"
                borderRadius={12}
                imageBorderRadius={10}
                selectedOptions={pcSelectedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">media-hover-top (Pills over image top on hover)</span>
              <ProductCard
                product={{
                  ...DEMO_CARD_PRODUCTS[0],
                  options: [
                    {
                      name: "Size",
                      displayType: "pill",
                      showOnCard: true,
                      cardPlacement: "media-hover-top",
                      values: [{ value: "S" }, { value: "M" }, { value: "L" }, { value: "XL" }],
                    },
                  ],
                }}
                cardType="standard"
                borderRadius={12}
                imageBorderRadius={10}
                selectedOptions={pcSelectedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">media (Bottom Overlay on image)</span>
              <ProductCard
                product={{
                  ...DEMO_CARD_PRODUCTS[1],
                  options: [
                    {
                      name: "Finish",
                      displayType: "swatch",
                      showOnCard: true,
                      cardPlacement: "media",
                      values: [
                        { value: "Matte Sand", swatchHex: "#d6c7b2" },
                        { value: "Clay", swatchHex: "#a75d43" },
                        { value: "Charcoal", swatchHex: "#334155" },
                      ],
                    },
                  ],
                }}
                cardType="standard"
                borderRadius={12}
                imageBorderRadius={10}
                selectedOptions={pcSelectedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
              />
            </div>
          </div>

          <h3 className="mb-3 mt-8 font-semibold text-[var(--color-ink)]">Variant Selection Effects (Color Click Swaps Photo, Price &amp; Stock)</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Apparel Card with Active Variant Effects</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[0]}
                cardType="standard"
                mediaRatio="4:5"
                selectionEffects={["image", "price", "stock"]}
                selectionMode="preview"
                borderRadius={12}
                imageBorderRadius={10}
                selectedOptions={pcSelectedOptions}
                previewedOptions={pcPreviewedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
                onPreviewOption={(name, val) =>
                  setPcPreviewedOptions(val ? { [name]: val } : null)
                }
              />
            </div>
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Homeware Card with Active Variant Effects</span>
              <ProductCard
                product={DEMO_CARD_PRODUCTS[1]}
                cardType="standard"
                mediaRatio="4:5"
                selectionEffects={["image", "price", "stock"]}
                selectionMode="preview"
                borderRadius={12}
                imageBorderRadius={10}
                selectedOptions={pcSelectedOptions}
                previewedOptions={pcPreviewedOptions}
                onSelectOption={(name, val) =>
                  setPcSelectedOptions((prev) => ({ ...prev, [name]: val }))
                }
                onPreviewOption={(name, val) =>
                  setPcPreviewedOptions(val ? { [name]: val } : null)
                }
              />
            </div>
          </div>
        </Card>

      </main>

      <footer className="p-6 text-center text-xs text-[var(--text-muted)]">
        Sale uses ink text (4.6:1 AA) — never white on #FF6B4A. Focus ring #0077B633 everywhere.
      </footer>
      {searchOpen && (
        <SearchDemoOverlay
          mode={searchMode}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          results={
            // TODO(hook-era): replace stub filter with the search source.
            searchQuery.trim().length < 2
              ? []
              : DEMO_STUB_CATALOG.filter((p) => p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
          }
          onClose={() => {
            setSearchOpen(false);
            searchTriggerRef.current?.focus();
          }}
        />
      )}
      {sheetOpen && (
        <SearchSheet
          query={liveSearch.query}
          results={liveSearch.results}
          status={liveSearch.status}
          dept={liveSearch.dept}
          departments={sheetDepartments}
          placeholder="Search products by style, material, or keyword…"
          activeIndex={sheetActive}
          closing={sheetClosing}
          onQuery={(q) => {
            liveSearch.setQuery(q);
            setSheetActive(0);
          }}
          onDept={liveSearch.setDept}
          onActive={setSheetActive}
          onSelect={() => closeSheetDemo()}
          onClose={() => closeSheetDemo()}
        />
      )}
      {edOpen && (
        <SearchEditorial
          query={editorialSearch.query}
          results={editorialSearch.results}
          status={editorialSearch.status}
          dept={editorialSearch.dept}
          departments={edDepartments}
          curated={DEMO_CATALOG}
          activeIndex={edActive}
          closing={edClosing}
          onQuery={(q) => {
            editorialSearch.setQuery(q);
            setEdActive(0);
          }}
          onDept={editorialSearch.setDept}
          onActive={setEdActive}
          onSelect={() => closeEditorialDemo()}
          onClose={() => closeEditorialDemo()}
        />
      )}
      {palOpen && (
        <SearchPalette
          query={paletteSearch.query}
          results={paletteSearch.results}
          status={paletteSearch.status}
          dept={paletteSearch.dept}
          departments={sheetDepartments}
          trending={DEMO_TRENDING}
          recent={paletteRecents.recent}
          curated={DEMO_CATALOG}
          activeIndex={palActive}
          addedIds={paletteQuickAdd.addedIds}
          pendingIds={paletteQuickAdd.pendingIds}
          closing={palClosing}
          onQuery={(q) => {
            paletteSearch.setQuery(q);
            setPalActive(0);
          }}
          onDept={paletteSearch.setDept}
          onActive={setPalActive}
          onSelect={(r) => {
            paletteRecents.push(r.name);
            closePaletteDemo();
          }}
          onQuickAdd={(r) => paletteQuickAdd.quickAdd(r.id)}
          onTrending={(t) => {
            paletteSearch.setQuery(t);
            setPalActive(0);
            paletteRecents.push(t);
          }}
          onClearRecent={paletteRecents.clear}
          onClose={() => closePaletteDemo()}
        />
      )}
      <Toast
        open={toast !== null}
        title={toast?.title ?? ""}
        message={toast?.message}
        icon={<Icon name="check" size={16} />}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
