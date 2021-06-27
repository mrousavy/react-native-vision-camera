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

echo "rm -rf ~/Library/Caches/CocoaPods"
rm -rf ~/Library/Caches/CocoaPods
echo "rm -rf ios/Pods"
rm -rf ios/Pods
echo "rm -rf ios/Podfile.lock"
rm -rf ios/Podfile.lock
echo "rm -rf ~/Library/Developer/Xcode/DerivedData/*"
rm -rf ~/Library/Developer/Xcode/DerivedData/*

echo "rm -rf android/.cxx"
rm -rf android/.cxx
echo "rm -rf android/.gradle"
rm -rf android/.gradle
echo "rm -rf android/build"
rm -rf android/build

cd ios
echo "pod deintegrate"
pod deintegrate
echo "bundle clean"
bundle clean --force

cd ../..
echo "yarn in $PWD"
yarn

cd example
echo "yarn in $PWD"
yarn

cd ios
echo "bundle install"
bundle install
echo "pod setup"
bundle exec pod setup
echo "pod install"
bundle exec pod install
