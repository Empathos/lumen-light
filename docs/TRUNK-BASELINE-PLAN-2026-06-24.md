# Lumen-Light Trunk Baseline Plan - 2026-06-24

## Decision

The canonical project remains the root **Lumen-Light** repository.

The `refined-lumen-light/` app is the product trunk candidate because it contains
the current live canvas-first implementation: TLDraw as the main surface,
OpenAI Realtime voice/text, tool-driven drawing, and the active product feel.

The older top-level implementation remains source material to port forward:
source spans, staged artifacts, accept/reject/edit/export behavior, synthetic
fixtures, schemas, briefing-review lessons, and validation tests.

## Migration Rule

Do not collapse this into one migration commit. Promote the trunk in small,
reviewable commits with one purpose each.

## Commit Path

1. Record this trunk decision while keeping the root Lumen-Light identity.
2. Reposition docs/spec language so the product is Lumen-Light / Beacon Table,
   not "Refined Lumen Light."
3. Remove offline fallback as a product requirement while keeping any local mock
   code only as dev/test scaffolding if still useful.
4. Promote or document the root layout for the canvas-first app.
5. Port the durable contract from the older implementation:
   source spans, staged artifacts, accept/reject/edit/export.
6. Run verification and create a clean branch baseline.

## Branch Point

Branch only after the trunk baseline is coherent and verified. The desired branch
point should show:

- root identity preserved as Lumen-Light,
- product trunk clearly identified,
- offline fallback removed from requirements,
- durable provenance/review contract queued or ported,
- tests/build passing for the baseline.
