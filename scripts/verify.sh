#!/usr/bin/env bash
# Definition of done for this repo. Runs every gate and reports pass/fail.
#
# Why this is a script and not a checklist in AGENTS.md: a checklist can be
# skimmed and skipped; a script either exits 0 or it does not. This is the
# single command to trust before claiming work is finished.
#
# Usage: bash scripts/verify.sh [--fast]
#   --fast  skip the visual harness (which needs a browser and ~40s)
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

FAST=0
[ "${1:-}" = "--fast" ] && FAST=1

fails=0
step() {
  local name="$1"; shift
  printf '  %-26s ' "$name"
  if "$@" >/tmp/verify-$$.log 2>&1; then
    echo "PASS"
  else
    echo "FAIL"
    sed 's/^/      /' /tmp/verify-$$.log | tail -15
    fails=$((fails + 1))
  fi
  rm -f /tmp/verify-$$.log
}

echo "verify: $(git log --oneline -1 2>/dev/null)"
dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
echo "        working tree: $dirty uncommitted file(s)"
echo

[ -d node_modules ] || { echo "  node_modules absent - run: npm ci"; exit 1; }

step "build"        npm run build
step "tsc --noEmit" npx tsc --noEmit
step "lint"         npm run lint

if [ "$FAST" -eq 1 ]; then
  echo "  visual harness             SKIPPED (--fast)"
else
  # The harness needs Chromium's shared libs, which are ephemeral here.
  step "browser deps"  bash scripts/ensure-browser-deps.sh
  step "visual harness" npx playwright test
fi

echo
if [ "$fails" -eq 0 ]; then
  echo "verify: ALL GATES PASS"
else
  echo "verify: $fails GATE(S) FAILED"
fi
exit "$fails"
