#!/usr/bin/env bash
set -euo pipefail

WORKDIR="$(pwd)"

# Prefer local Supabase CLI if available
if command -v supabase >/dev/null 2>&1; then
  exec supabase "$@"
fi

# Fallback: run Supabase CLI via Docker
docker run --rm --pull=always \
  -v "$WORKDIR:/workspace" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -w /workspace \
  ghcr.io/supabase/cli:latest "$@"


