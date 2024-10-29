#!/bin/bash

if which ktlint >/dev/null; then
  cd android && ktlint --color --relative --editorconfig=./.editorconfig -F ./**/*.kt*
else
  echo "error: KTLint not installed, install with 'brew install ktlint' (or manually from https://github.com/pinterest/ktlint)"
  exit 1
fi
