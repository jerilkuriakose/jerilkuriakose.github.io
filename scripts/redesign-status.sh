#!/usr/bin/env bash
# Derive redesign status from the repository. Nothing here is hand-maintained,
# so nothing here can go stale.
#
# Rationale: vendor guidance (Cursor rules docs; Anthropic Claude Code memory
# docs) is to reference canonical artifacts rather than copy them, and to skip
# facts derivable from the codebase. Everything this script prints is derivable,
# so it must NOT be duplicated into TRACKER.md.
#
# Usage: bash scripts/redesign-status.sh
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
SPEC="docs/superpowers/specs/2026-08-31-portfolio-redesign-design.md"
PLANS="docs/superpowers/plans"
REVIEWS="docs/superpowers/reviews"

bold() { printf '\n\033[1m%s\033[0m\n' "$1"; }

bold "REPO"
printf '  HEAD        %s\n' "$(git log --oneline -1 2>/dev/null || echo '(no git)')"
printf '  branch      %s\n' "$(git branch --show-current 2>/dev/null)"
dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
printf '  uncommitted %s file(s)' "$dirty"
if [ "$dirty" -gt 0 ]; then
  printf '   <-- UNSAVED WORK: ask before any checkout/clean\n'
  git status --short | sed 's/^/                /'
else
  printf '   (clean)\n'
fi

bold "PHASES (headings in spec §15)"
if [ -f "$SPEC" ]; then
  grep -E '^### Phase ' "$SPEC" | sed 's/^### /  /' | cut -c1-96
else
  printf '  !! spec missing: %s\n' "$SPEC"
fi

bold "PLANS WRITTEN"
if compgen -G "$PLANS/*.md" > /dev/null; then
  for f in "$PLANS"/*.md; do
    # grep -c prints 0 AND exits 1 on no-match, so `|| echo 0` would double it.
    total=$(grep -c -E '^- \[[ x]\]' "$f" || true)
    done_n=$(grep -c -E '^- \[x\]' "$f" || true)
    printf '  %-58s %s/%s steps done\n' "$(basename "$f")" "${done_n:-0}" "${total:-0}"
  done
else
  printf '  (none)\n'
fi

bold "BLOCKING HUMAN GATES (from spec checkboxes)"
if [ -f "$SPEC" ]; then
  gates=$(grep -nE '^- \[[ x]\] \*\*G[0-9]' "$SPEC" || true)
  if [ -z "$gates" ]; then
    printf '  !! no gate checkboxes found - spec may have drifted\n'
  else
    grep -E '^- \[[ x]\] \*\*G[0-9]' "$SPEC" \
      | sed -E 's/^- \[ \]/  OPEN  /; s/^- \[x\]/  DONE  /' \
      | sed -E 's/\*\*//g' | cut -c1-100
    open_n=$(grep -cE '^- \[ \] \*\*G[0-9]' "$SPEC" || true)
    printf '  --> %s gate(s) still blocking\n' "${open_n:-0}"
  fi
fi

bold "REVIEWS (derived from files, not memory)"
if compgen -G "$REVIEWS/*.md" > /dev/null; then
  for f in "$REVIEWS"/*.md; do
    verdict=$(grep -m1 -E '^\*\*Verdict:\*\*' "$f" | sed -E 's/^\*\*Verdict:\*\* *//' | cut -c1-40)
    printf '  %-46s %s\n' "$(basename "$f")" "${verdict:-(no verdict line)}"
  done
  ovr=$(grep -rlE 'OVERRIDDEN by measurement' "$REVIEWS" 2>/dev/null | wc -l | tr -d ' ')
  [ "$ovr" -gt 0 ] && printf '  !! %s review(s) contain OVERRIDDEN findings - read before re-reviewing\n' "$ovr"
else
  printf '  (none written)\n'
fi

bold "GATES (run now, not remembered)"
if [ -d node_modules ]; then
  npm run build   >/dev/null 2>&1 && printf '  build  PASS\n' || printf '  build  FAIL\n'
  npx tsc --noEmit >/dev/null 2>&1 && printf '  tsc    PASS\n' || printf '  tsc    FAIL\n'
  npm run lint    >/dev/null 2>&1 && printf '  lint   PASS\n' || printf '  lint   FAIL\n'
  if grep -q '"test:visual"' package.json 2>/dev/null; then
    printf '  visual harness installed: yes\n'
  else
    printf '  visual harness installed: no (Phase 0 Task 1 not done)\n'
  fi
else
  printf '  node_modules absent - run: npm ci\n'
fi

bold "STACK (from package.json, not memory)"
node -e '
const p=require("./package.json");
for (const k of ["next","react","tailwindcss","motion","eslint"])
  console.log("  "+k.padEnd(14),(p.dependencies?.[k]??p.devDependencies?.[k]??"-"));
' 2>/dev/null || printf '  (unreadable)\n'

printf '\nEverything above is DERIVED - do not restate it in prose anywhere.\n'
printf 'The only hand-maintained state is the next action: docs/superpowers/TRACKER.md\n'
printf 'Write-through rule: record a fact in its artifact the same turn it changes.\n'
