#!/bin/bash

if which swiftlint >/dev/null; then
  cd ios && swiftlint --quiet --fix && swiftlint --quiet
else
  echo "warning: SwiftLint not installed, download from https://github.com/realm/SwiftLint"
fi
