/**
 * TEMPORARY living showcase (route /components) — scaffolding with an
 * expiry date: DELETE at homepage launch. Not a product surface; do not
 * link it from shop chrome, do not add new sections without a task.
 */
"use client";

import { useEffect, useRef, useState } from "react";
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

const DEMO_CATALOG: DemoResult[] = [
  { name: "Ocean Linen Shirt", price: "$48" },
  { name: "Court Sneaker", price: "$89" },
  { name: "Trail Runner", price: "$120" },
  { name: "Denim Jacket", price: "$95" },
  { name: "Silk Scarf", price: "$35" },
  { name: "Wool Beanie", price: "$28" },
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
  const [searchMode, setSearchMode] = useState<"trap" | "light">("trap");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

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
              : DEMO_CATALOG.filter((p) => p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
          }
          onClose={() => {
            setSearchOpen(false);
            searchTriggerRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
