"use client";

import { useState } from "react";
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
} from "@/components/ui";

const section: React.CSSProperties = { maxWidth: 960, margin: "0 auto", padding: "28px 24px" };

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-8 font-display text-2xl text-[var(--color-ink)]">{children}</h2>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export default function PreviewPage() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [agree, setAgree] = useState(false);
  const [notify, setNotify] = useState(true);
  const [ship, setShip] = useState("flat");
  const [radius, setRadius] = useState(8);
  const [dialogOpen, setDialogOpen] = useState(false);

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

        <H2>7. IconButton</H2>
        <Card>
          <Row>
            <IconButton label="Search">⌕</IconButton>
            <IconButton label="Cart">🛒</IconButton>
            <IconButton label="Close">✕</IconButton>
          </Row>
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
      </main>

      <footer className="p-6 text-center text-xs text-[var(--text-muted)]">
        Sale uses ink text (4.6:1 AA) — never white on #FF6B4A. Focus ring #0077B633 everywhere.
      </footer>
    </div>
  );
}
