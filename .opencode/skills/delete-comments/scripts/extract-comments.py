"""Emit a review table: every comment block with the code around it.

Usage: python extract-comments.py <repo-path> [output.csv]
Read-only; writes only the CSV. Columns:
repo,file,start,end,lines,text,code_before,code_after,suggestion
"""
import csv, pathlib, re, sys

EX = {"node_modules", "dist", ".next"}
GENERATED = {"next-env.d.ts"}
PAT = re.compile(
    r"/\*\*(.*?)\*/|/\*(?!\*)(.*?)\*/|(^[ \t]*//(?!\/)[^\n]*(?:\n[ \t]*//(?!\/)[^\n]*)*)",
    re.S | re.M,
)
DIR = ("eslint-disable", "oxlint-disable", "@ts-", "prettier-ignore", "@deprecated")
WHY = ("why", "because", "rejected", "deliberate", "invariant", "trade-off",
       "rather than", "instead of", "guarantee", "prevent", "must never", "used to",
       "replaced", "which is why", "the reason", "external", "constraint")


def clean(body: str) -> str:
    parts = []
    for line in body.splitlines():
        s = line.strip()
        if s.startswith("*"):
            s = s[1:].strip()
        if s.startswith("//"):
            s = s[2:].strip()
        if s:
            parts.append(s)
    return " ".join(parts)


def suggest(text: str) -> str:
    low = text.lower()
    if any(k in low for k in DIR):
        return "never"
    if any(k in low for k in WHY):
        return "keep-review"
    return "delete-review"


def main() -> None:
    root = pathlib.Path(sys.argv[1]).resolve()
    out = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else root / "comment-review.csv"
    rows = []
    for p in root.rglob("*.ts"):
        if any(x in p.parts for x in EX) or p.name in GENERATED:
            continue
        try:
            text = p.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        lines = text.splitlines()
        for m in PAT.finditer(text):
            body = next((g for g in m.groups() if g), m.group(0))
            body = clean(body)
            if len(body) < 10:
                continue
            s = text.count("\n", 0, m.start()) + 1
            e = s + text[m.start():m.end()].count("\n")
            before = " / ".join(x.strip() for x in lines[max(0, s - 6):s - 1])
            after = " / ".join(x.strip() for x in lines[e:e + 15])
            rows.append({
                "repo": root.name, "file": str(p.relative_to(root)).replace("\\", "/"),
                "start": s, "end": e, "lines": e - s + 1, "text": body[:500],
                "code_before": before[:300], "code_after": after[:500],
                "suggestion": suggest(body),
            })
    with out.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["repo", "file", "start", "end", "lines",
                                          "text", "code_before", "code_after", "suggestion"])
        w.writeheader()
        w.writerows(rows)
    print(f"wrote {len(rows)} blocks to {out}")


if __name__ == "__main__":
    main()
