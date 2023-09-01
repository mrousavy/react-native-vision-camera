#!/bin/bash

cd "$(dirname "$0")"
cd ..
echo "Running clean script in $PWD"

cd android
echo "./gradlew clean"
./gradlew clean

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

echo "rm -rf android/.cxx"
rm -rf android/.cxx
echo "rm -rf android/.gradle"
rm -rf android/.gradle
echo "rm -rf android/build"
rm -rf android/build

echo "yarn in $PWD"
yarn

cd example
echo "yarn in $PWD"
yarn
