#!/bin/bash

echo "Formatting Swift code.."
./scripts/swiftformat.sh

echo "Linting Swift code.."
./scripts/swiftlint.sh

echo "Linting Kotlin code.."
./scripts/ktlint.sh

echo "Formatting C++ code.."
./scripts/clang-format.sh

echo "Linting JS/TS code.."
yarn lint --fix
yarn typescript

echo "All done!"
