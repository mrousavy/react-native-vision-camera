#!/bin/bash

if which cpplint >/dev/null; then
  cpplint --linelength=160 --recursive cpp android/src/main/cpp
else
  echo "warning: cpplint not installed, download from https://github.com/cpplint/cpplint"
fi
