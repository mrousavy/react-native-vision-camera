#!/bin/bash

# Do not exit on errors
set +e

cd "$(pwd)" || exit 0

# Run commands and ignore any errors
{
  # Install JS lockfiles
  bun i
  bun run build

  # Install example pods
  bun example bundle-install
  bun example pods

  # Add everything to git
  git add **/*.lock
} || true

# No errors - whatever.
exit 0
