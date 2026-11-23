"""Apply approved comment decisions with safety gates.

Usage: python apply-decisions.py <decisions.csv>
Expected columns: repo,file,start,end,decision,reason
Only decision=delete is applied. Bottom-to-top per file, whole-comment ranges
only, newline-preserving. Source untouched when a range fails validation.
"""
import csv, pathlib, sys

ROOT = pathlib.Path(r"E:\E-Commerce")
SAFE = ("@deprecated", "eslint-disable", "oxlint-disable", "@ts-", "prettier-ignore",
        "/// <reference", "ARCHITECTURE_DECISIONS")


def main() -> None:
    path = pathlib.Path(sys.argv[1])
    rows = list(csv.DictReader(path.open(encoding="utf-8")))
    ops = {}
    skipped = []
    delete_rows = 0
    for r in rows:
        # Subagents have written uppercase DELETE before; the script matched
        # exactly and silently applied nothing.
        decision = (r.get("decision") or "").strip().lower()
        if decision not in ("delete", "keep", "pointer"):
            skipped.append("unknown decision " + repr(r.get("decision")))
            continue
        if decision != "delete":
            continue
        delete_rows += 1
        base = ROOT / "frontend" / "storefront" if r["repo"] == "storefront" else ROOT / r["repo"]
        p = base / r["file"]
        if not p.exists():
            skipped.append("missing " + r["file"])
            continue
        with p.open(encoding="utf-8", newline="") as f:
            lines = f.readlines()
        s, e = int(r["start"]), int(r["end"])
        if s < 1 or e > len(lines) or s > e:
            skipped.append("range " + r["file"])
            continue
        block = "".join(lines[s - 1:e])
        if any(k in block for k in SAFE):
            skipped.append("directive " + r["file"])
            continue
        # ADR pointers use many prefixes (ADR-events, ADR-db, ADR-comments),
        # so catch the shape rather than any fixed list of ids.
        if any(l.lstrip().startswith("// ADR-") for l in lines[s - 1:e]):
            skipped.append("ADR pointer " + r["file"])
            continue
        # Guard against an off-by-one range that would delete a code line:
        # every line in the range must itself be a comment line.
        if not all(str(lines[i - 1]).lstrip().startswith(("//", "*", "/*", "*/"))
                   for i in range(s, e + 1)):
            skipped.append("range includes code " + r["file"])
            continue
        ops.setdefault(p, []).append((s, e))

    deleted = 0
    for p, ranges in ops.items():
        with p.open(encoding="utf-8", newline="") as f:
            lines = f.readlines()
        for s, e in sorted(ranges, reverse=True):
            del lines[s - 1:e]
            deleted += e - s + 1
        with p.open("w", encoding="utf-8", newline="") as f:
            f.writelines(lines)
    print(f"deleted {deleted} comment lines across {len(ops)} files; skipped {len(skipped)}")
    if deleted == 0 and delete_rows:
        print("HINT: nothing applied - check decision values (use lowercase 'delete')")
    for x in skipped[:10]:
        print("SKIP", x)


if __name__ == "__main__":
    main()
