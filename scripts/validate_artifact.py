#!/usr/bin/env python3
"""Validate a Lumen Light conversation artifact fixture."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator


def fail(message: str) -> int:
    print(f"LUMEN_LIGHT_ARTIFACT_INVALID: {message}", file=sys.stderr)
    return 1


def main() -> int:
    if len(sys.argv) != 2:
        return fail("usage: validate_artifact.py path/to/artifact.json")

    path = Path(sys.argv[1])
    data = json.loads(path.read_text(encoding="utf-8"))
    schema_path = Path(__file__).resolve().parents[1] / "schemas" / "conversation-artifact.schema.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))

    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(data), key=lambda error: list(error.path))
    if errors:
        error = errors[0]
        location = ".".join(str(part) for part in error.path) or "artifact"
        return fail(f"{location}: {error.message}")

    print("LUMEN_LIGHT_ARTIFACT_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
