#!/bin/bash

if which cpplint >/dev/null; then
  clang-format -style=file -i **/*.h,**/*.cpp,**/*.m,**/*.mm
else
  echo "warning: clang-format not installed, download from https://clang.llvm.org/docs/ClangFormat.html"
fi
