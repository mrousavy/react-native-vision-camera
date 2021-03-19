#!/bin/bash

if which cpplint >/dev/null; then
  cd cpp && cpplint
else
  echo "warning: cpplint not installed, download from https://github.com/cpplint/cpplint"
fi
