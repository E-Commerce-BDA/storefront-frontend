/**
 * Dumb PasswordMeter — strength bars derived purely from `value`.
 * Guidance text is server-judged per A11.1; this meter is preliminary
 * courtesy display only. props → JSX. No state.
 */
export function passwordScore(value: string): 0 | 1 | 2 | 3 | 4 {
  if (value === "") return 0;
  let s = 0;
  if (value.length >= 8) s++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) s++;
  if (/\d/.test(value)) s++;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 14) s++;
  return Math.min(s, 4) as 0 | 1 | 2 | 3 | 4;
}

const BAR_COLORS = [
  "var(--color-error)",
  "var(--color-warning)",
  "var(--color-accent)",
  "var(--color-success)",
];

const GUIDANCE = [
  "Use 8+ characters with mixed case and a number.",
  "Weak — add mixed case and a number.",
  "Fair — add a number or symbol.",
  "Good — add a symbol for great.",
  "Strong password.",
];

export interface PasswordMeterProps {
  value: string;
  id: string;
}

export default function PasswordMeter({ value, id }: PasswordMeterProps) {
  const score = passwordScore(value);
  return (
    <div className="grid gap-1.5">
      <div className="pw-meter flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              height: 6,
              flex: 1,
              borderRadius: 9999,
              background: i < score ? BAR_COLORS[score - 1] : "var(--border)",
            }}
          />
        ))}
      </div>
      <p id={`${id}-hint`} className="m-0 text-[13px] text-[var(--text-muted)]">
        {GUIDANCE[score]}
      </p>
    </div>
  );
}
