#!/usr/bin/env bash
# Ensure Chromium's shared libraries are present, then PROVE it.
#
# Why this is a script and not a note in AGENTS.md: a prose claim that "the libs
# are installed" was written once, silently became false when the environment
# wiped them, and misled a later session. A claim that verifies itself cannot
# do that. Run this before any browser work; it is idempotent and fast when the
# libs are already present.
#
# Usage: bash scripts/ensure-browser-deps.sh
set -uo pipefail

# The t64 suffixes matter: Ubuntu 24.04 renamed these in the 64-bit time_t
# transition. The pre-noble names (libasound2, libatk1.0-0) do not exist here,
# which is why people wrongly conclude the deps cannot be installed.
PKGS=(
  libglib2.0-0t64 libnss3 libnspr4 libdbus-1-3 libatk1.0-0t64
  libatk-bridge2.0-0t64 libatspi2.0-0t64 libx11-6 libxcomposite1 libxdamage1
  libxext6 libxfixes3 libxrandr2 libxcb1 libxkbcommon0 libgbm1 libasound2t64
  libcairo2 libpango-1.0-0 libcups2t64 fonts-liberation libfontconfig1
)

find_chrome() {
  if [ -n "${CHROME_PATH:-}" ] && [ -x "$CHROME_PATH" ]; then
    printf '%s' "$CHROME_PATH"; return 0
  fi
  # Newest cached build wins.
  local c
  c=$(ls -d "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux/chrome 2>/dev/null | sort -V | tail -1)
  [ -n "$c" ] && printf '%s' "$c"
}

CHROME="$(find_chrome)"
if [ -z "$CHROME" ]; then
  echo "!! No cached Chromium found under ~/.cache/ms-playwright."
  echo "   Playwright browsers are normally already cached here; do NOT run"
  echo "   'playwright install-deps'. Investigate before downloading ~500MB."
  exit 1
fi

# Confirm it IS Chromium before trusting any check against it. Without this,
# any exit-0 binary (e.g. /bin/true via CHROME_PATH) passes vacuously.
ver="$("$CHROME" --version 2>/dev/null || true)"
case "$ver" in
  *Chrom*) : ;;
  *) echo "!! Not a Chromium binary: $CHROME"
     echo "   --version reported: ${ver:-<nothing>}"
     exit 1 ;;
esac

missing() { ldd "$CHROME" 2>/dev/null | grep -c "not found"; }

before="$(missing)"
if [ "$before" -eq 0 ]; then
  echo "browser deps: already satisfied (0 unresolved libs)"
else
  echo "browser deps: $before unresolved libs - installing"
  if ! sudo -n true 2>/dev/null; then
    echo "!! passwordless sudo unavailable; cannot install. Aborting."
    exit 1
  fi
  sudo apt-get install -y -q "${PKGS[@]}" >/dev/null 2>&1 || {
    echo "!! apt-get failed"; exit 1; }
fi

after="$(missing)"
if [ "$after" -ne 0 ]; then
  echo "!! FAILED: $after libs still unresolved after install:"
  ldd "$CHROME" 2>/dev/null | grep "not found" | sed 's/^/     /'
  exit 1
fi

# Final proof: actually launch it. A resolved linker is necessary, not sufficient.
if ! "$CHROME" --headless --no-sandbox --dump-dom about:blank >/dev/null 2>&1; then
  echo "!! FAILED: libs resolve but Chromium will not launch"
  exit 1
fi

echo "browser deps: VERIFIED (0 unresolved, launch succeeded)"
echo "  chrome: $CHROME"
