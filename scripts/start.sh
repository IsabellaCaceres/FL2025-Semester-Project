#!/usr/bin/env bash
set -euo pipefail

# Export variables from .env so Expo can read EXPO_PUBLIC_*
set -a
if [ -f ./.env ]; then
  . ./.env
fi
set +a

exec expo start "$@"


