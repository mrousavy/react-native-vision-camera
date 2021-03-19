#!/bin/bash

if which cpplint >/dev/null; then
  cpplint --linelength=230 --recursive cpp android/src/main/cpp --filter=-legal/copyright,-readability/todo,-build/namespaces,-whitespace/comments
else
  echo "warning: cpplint not installed, download from https://github.com/cpplint/cpplint"
fi
