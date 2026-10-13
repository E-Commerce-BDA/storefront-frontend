/**
 * Home route (/) — chrome arrives from the root layout (NavbarMount,
 * server-resolved). Interim: section index below chrome until hero lands.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen">
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px" }}>
        <h1 className="font-display text-2xl text-[var(--color-ink)]">Storefront home (under construction)</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Chrome above is live (dismiss the bar, flip slides, hover links). Sections land here slice by slice —
          hero first.
        </p>
        <ul className="mt-4 grid gap-2 text-sm">
          <li>
            <a href="/components" style={{ color: "var(--color-accent)", fontWeight: 600 }}>
              Component showcase
            </a>{" "}
            <span className="text-[var(--text-muted)]">— temporary living style guide, deleted at launch</span>
          </li>
          <li>
            <a href="/signin" style={{ color: "var(--color-accent)", fontWeight: 600 }}>
              Sign in
            </a>{" "}
            <span className="text-[var(--text-muted)]">— conversion route, intentionally chromeless</span>
          </li>
        </ul>
      </main>
    </div>
  );
}
