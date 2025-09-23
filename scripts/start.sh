#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname "$0")" >/dev/null 2>&1 && pwd)"
exec node "$SCRIPT_DIR/start.mjs" "$@"


