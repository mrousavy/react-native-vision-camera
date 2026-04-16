#!/bin/bash
set -e

echo "Starting the release process..."
echo "Provided options: $*"

for pkg in packages/*; do
  [ -d "$pkg" ] || continue
  echo "Publishing '$(basename "$pkg")' to NPM"
  (cd "$pkg" && bun release "$@")
done

echo "Creating a Git bump commit and GitHub release"
bun run release-it "$@"

echo "Successfully released VisionCamera!"
