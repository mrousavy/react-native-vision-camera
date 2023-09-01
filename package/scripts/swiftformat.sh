#!/bin/bash

if which swiftformat >/dev/null; then
  cd ios && swiftformat --quiet .
else
  echo "warning: SwiftFormat not installed, download from https://github.com/nicklockwood/SwiftFormat"
fi
