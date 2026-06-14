#!/usr/bin/env python3
"""Validate a Lumen Light conversation artifact fixture."""

from __future__ import annotations

import json
import sys
from pathlib import Path


VALID_KINDS = {
    "highlight",
    "card",
    "diagram_node",
    "diagram_edge",
    "decision",
    "question",
    "action",
}


def fail(message: str) -> int:
    print(f"LUMEN_LIGHT_ARTIFACT_INVALID: {message}", file=sys.stderr)
    return 1


def main() -> int:
    if len(sys.argv) != 2:
        return fail("usage: validate_artifact.py path/to/artifact.json")

    path = Path(sys.argv[1])
    data = json.loads(path.read_text(encoding="utf-8"))

    if not str(data.get("artifact_id", "")).startswith("artifact_"):
        return fail("artifact_id must start with artifact_")
    if data.get("kind") not in VALID_KINDS:
        return fail("kind is not recognized")
    if not isinstance(data.get("text"), str) or not data["text"].strip():
        return fail("text is required")
    if not isinstance(data.get("source_turn_ids"), list) or not data["source_turn_ids"]:
        return fail("source_turn_ids must be a non-empty list")
    confidence = data.get("confidence")
    if not isinstance(confidence, (int, float)) or not 0 <= confidence <= 1:
        return fail("confidence must be between 0 and 1")

    print("LUMEN_LIGHT_ARTIFACT_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
