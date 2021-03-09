#!/bin/bash

echo "Formatting Swift code.."
./scripts/swiftformat.sh

echo "Linting Swift code.."
./scripts/swiftlint.sh

echo "Linting Kotlin code.."
./scripts/ktlint.sh

echo "Linting JS/TS code.."
yarn lint --fix

echo "All done!"
