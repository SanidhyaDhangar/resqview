"""Check the Phase 3 submission copy against the portal's character caps.

The portal silently truncates, so verify before pasting:

    python docs/check_lengths.py
"""
from __future__ import annotations

import pathlib
import re
import sys

CAPS = {
    "Disaster Scenario": 537,
    "Timeliness, Real-Time Responsiveness & Technical Reliability": 484,
    "Comprehensiveness, Use of Available Data & Novel Data Discovery": 438,
    "Integration, Synthesis Quality & Responsible Data Handling": 411,
    "Usability, Clarity & Operational Readiness for Emergency Responders": 490,
}

SOURCE = pathlib.Path(__file__).parent / "phase3-submission.md"


def sections(markdown: str) -> dict[str, str]:
    """Pull each '## Heading *(cap N)*' block out of the document.

    Splits on *every* level-2 heading, not just capped ones — otherwise the final capped
    section swallows the trailing prose and reports a wildly inflated length.
    """
    found = {}
    heading = re.compile(r"^## (.+?)\s*$", re.MULTILINE)
    capped = re.compile(r"^(.+?)\s+\*\(cap \d+\)\*$")

    matches = list(heading.finditer(markdown))
    for i, match in enumerate(matches):
        title = capped.match(match.group(1).strip())
        if not title:
            continue  # an uncapped section, e.g. the notes at the end
        end = matches[i + 1].start() if i + 1 < len(matches) else len(markdown)
        body = markdown[match.end() : end].replace("---", "").strip()
        found[title.group(1).strip()] = body
    return found


def main() -> int:
    blocks = sections(SOURCE.read_text(encoding="utf-8"))
    failures = 0

    for field, cap in CAPS.items():
        body = blocks.get(field)
        if body is None:
            print(f"MISSING  {field}")
            failures += 1
            continue

        length = len(body)
        headroom = cap - length
        status = "ok " if headroom >= 0 else "OVER"
        if headroom < 0:
            failures += 1
        print(f"{status} {length:>4}/{cap:<4} ({headroom:+d})  {field}")

    print()
    print("All fields fit." if not failures else f"{failures} field(s) need trimming.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
