#!/bin/bash

set -euo pipefail

FILES=()
while IFS= read -r -d '' f; do FILES+=("$f"); done < <(
  find packages -type f \( -name '*.kt' -o -name '*.kts' \) -path '*/android/src/main/java/*' -print0
)

if ! command -v ktlint >/dev/null; then
  echo "error: ktlint not installed, install with 'brew install ktlint' (see https://github.com/pinterest/ktlint )"
  exit 1
fi

if ((${#FILES[@]} == 0)); then
  echo "No Kotlin files found to format."
  exit 0
fi

ktlint --editorconfig=./config/.editorconfig --format "${FILES[@]}"
echo "Kotlin Format done!"
