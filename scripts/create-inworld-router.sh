#!/usr/bin/env bash
#
# Create an Inworld LLM Router for Lumen-Light's realtime "brain".
#
# The router is what session.model points at. A single fixed router gives us an
# advanced model plus automatic failover, with no per-request routing logic.
# Voice realism is unaffected by this choice (that's the TTS layer) — the only
# cost of a heavier primary model is response latency.
#
# Usage:
#   INWORLD_API_KEY=... ./scripts/create-inworld-router.sh
#
# Optional overrides (pick ids from Inworld Portal -> Models; for low-latency
# realtime prefer a "fast"/"flash"/"mini" tier as the primary). NOTE: Gemini
# "pro" tiers and bare gemini-3.x are reasoning models that reply tersely/slowly
# in realtime unless you disable reasoning (the session sets reasoning effort to
# NONE for exactly this reason). A "flash" model is the safe realtime default.
#   ROUTER_NAME=lumen-router-35flash
#   PRIMARY_MODEL=google-ai-studio/gemini-3.5-flash
#   FALLBACK_MODEL=google-ai-studio/gemini-2.5-flash
#
# NOTE: avoid OpenAI gpt-5.x as the realtime primary — Inworld routes the LLM via
# /v1/chat/completions, where OpenAI rejects "function tools + reasoning_effort"
# for gpt-5.x (and Lumen always sends tools). Anthropic/Gemini "flash"/"haiku"
# tiers support tools cleanly. The session sets reasoning effort to NONE for low
# realtime latency regardless.
#
# After it runs, copy the returned router id (inworld/<name>) into
# INWORLD_REALTIME_MODEL in .env.local.
set -euo pipefail

: "${INWORLD_API_KEY:?Set INWORLD_API_KEY (Inworld Portal -> Settings -> API Keys)}"
ROUTER_NAME="${ROUTER_NAME:-lumen-router-35flash}"
PRIMARY_MODEL="${PRIMARY_MODEL:-google-ai-studio/gemini-3.5-flash}"
FALLBACK_MODEL="${FALLBACK_MODEL:-google-ai-studio/gemini-2.5-flash}"

echo "Creating router '${ROUTER_NAME}': primary=${PRIMARY_MODEL} fallback=${FALLBACK_MODEL}"

curl --fail --silent --show-error \
  --request POST 'https://api.inworld.ai/router/v1/routers' \
  --header "Authorization: Basic ${INWORLD_API_KEY}" \
  --header 'Content-Type: application/json' \
  --data @- <<JSON
{
  "name": "${ROUTER_NAME}",
  "default_route": {
    "route_id": "default",
    "variants": [
      { "variant": { "variant_id": "primary",  "model_id": "${PRIMARY_MODEL}"  }, "weight": 100 },
      { "variant": { "variant_id": "fallback", "model_id": "${FALLBACK_MODEL}" }, "weight": 0 }
    ]
  }
}
JSON

echo
echo "Done. Set INWORLD_REALTIME_MODEL=inworld/${ROUTER_NAME} in .env.local"
