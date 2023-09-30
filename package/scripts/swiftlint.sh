#!/bin/bash

if which swiftlint >/dev/null; then
  cd ios && swiftlint --quiet --fix && swiftlint --quiet
else
  echo "warning: SwiftLint not installed, install with 'brew install swiftlint' (or manually from https://github.com/realm/SwiftLint)"
fi
