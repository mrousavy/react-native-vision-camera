#!/bin/bash

if which clang-format >/dev/null; then
  for file in $(find cpp ios android/src/main/cpp -type f \( -name "*.h" -o -name "*.cpp" \)); do
      clang-format -i "$file"
  done
else
  echo "warning: clang-format not installed, download from https://clang.llvm.org/docs/ClangFormat.html (or run brew install clang-format)"
fi
