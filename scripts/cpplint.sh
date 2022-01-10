#!/bin/bash

if which cpplint >/dev/null; then
  cpplint --linelength=230 --filter=-legal/copyright,-readability/todo,-build/namespaces,-whitespace/comments,-build/include_order,-build/c++11 --quiet --recursive --exclude "android/src/main/cpp/reanimated-headers" cpp android/src/main/cpp
else
  echo "warning: cpplint not installed, download from https://github.com/cpplint/cpplint"
fi
