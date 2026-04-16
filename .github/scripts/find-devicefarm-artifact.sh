#!/usr/bin/env bash

# From AWS devicefarm we receive a zip file with all the artifacts. This script helps retrieving
# a specific artifact file from the zip and copying it to a destination path in the workspace.

set -euo pipefail

ARTIFACT_DIR="${1:-}"
TARGET_NAME="${2:-}"
DESTINATION_PATH="${3:-}"

if [[ -z "$ARTIFACT_DIR" || ! -d "$ARTIFACT_DIR" ]]; then
  echo "Device Farm artifact folder missing: '$ARTIFACT_DIR'" >&2
  exit 1
fi

if [[ -z "$TARGET_NAME" ]]; then
  echo "Expected target artifact filename as the second argument." >&2
  exit 1
fi

if [[ -z "$DESTINATION_PATH" ]]; then
  echo "Expected destination path as the third argument." >&2
  exit 1
fi

FOUND_FILE="$(find "$ARTIFACT_DIR" -type f -name "$TARGET_NAME" | head -n 1 || true)"
if [[ -z "$FOUND_FILE" ]]; then
  EXTRACT_DIR="$(mktemp -d)"

  while IFS= read -r ZIP_FILE; do
    unzip -o -qq "$ZIP_FILE" -d "$EXTRACT_DIR" || true
  done < <(find "$ARTIFACT_DIR" -type f -name '*.zip')

  FOUND_FILE="$(find "$EXTRACT_DIR" -type f -name "$TARGET_NAME" | head -n 1 || true)"
fi

if [[ -z "$FOUND_FILE" ]]; then
  echo "Could not find $TARGET_NAME in Device Farm artifacts." >&2
  exit 1
fi

mkdir -p "$(dirname "$DESTINATION_PATH")"
cp "$FOUND_FILE" "$DESTINATION_PATH"

echo "Found artifact file: $FOUND_FILE"
echo "Copied artifact file to workspace: $DESTINATION_PATH"
printf '%s\n' "$DESTINATION_PATH"
