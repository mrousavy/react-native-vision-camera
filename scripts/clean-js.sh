#!/bin/bash

cd "$(dirname "$0")"
cd ..
echo "Running clean script in $PWD"

echo "rm -rf node_modules"
rm -rf node_modules
echo "rm -rf yarn.lock"
rm -rf yarn.lock
rm -rf package-lock.json

echo "cd example"
cd example

echo "rm -rf node_modules"
rm -rf node_modules
echo "rm -rf yarn.lock"
rm -rf yarn.lock
rm -rf package-lock.json

cd ..
echo "yarn in $PWD"
yarn

cd example
echo "yarn in $PWD"
yarn
