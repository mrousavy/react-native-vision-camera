#!/bin/bash

if which clang-format >/dev/null; then
  find ios android/src/main/cpp -type f \( -name "*.h" -o -name "*.cpp" -o -name "*.m" -o -name "*.mm" \) -print0 | while read -d $'\0' file; do
    clang-format -style=file:./.clang-format -i "$file"
  done
else
  echo "error: clang-format not installed, install with 'brew install clang-format' (or manually from https://clang.llvm.org/docs/ClangFormat.html)"
  exit 1
fi
