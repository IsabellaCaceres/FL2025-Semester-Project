#!/usr/bin/env bash
set -euo pipefail

WORKDIR="/Users/andrew/Desktop/FL2025-Semester-Project"

docker run --rm --pull=always \
  -v "$WORKDIR:/workspace" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -w /workspace \
  ghcr.io/supabase/cli:latest "$@"


