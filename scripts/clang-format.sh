#!/bin/bash

set -e

CPP_DIRS=(
  "packages/**/android/src/main/cpp"
  "packages/**/cpp"
  "packages/**/ios"
)

if which clang-format >/dev/null; then
  DIRS=$(printf "%s " "${CPP_DIRS[@]}")
  find $DIRS -type f \( -name "*.h" -o -name "*.hpp" -o -name "*.cpp" -o -name "*.m" -o -name "*.mm" -o -name "*.c" \) -print0 | while read -d $'\0' file; do
    clang-format -style=file:./config/.clang-format -i "$file"
  done
  echo "C++ Format done!"
else
  echo "error: clang-format not installed, install with 'brew install clang-format' (or manually from https://clang.llvm.org/docs/ClangFormat.html )"
  exit 1
fi
