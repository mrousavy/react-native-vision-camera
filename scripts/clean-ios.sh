#!/bin/bash

cd "$(dirname "$0")"
cd ..
echo "Running clean script in $PWD"

echo "rm -rf ~/Library/Caches/CocoaPods"
rm -rf ~/Library/Caches/CocoaPods
echo "rm -rf ~/Library/Developer/Xcode/DerivedData/*"
rm -rf ~/Library/Developer/Xcode/DerivedData/*

echo "cd example/ios"
cd example/ios
echo "rm -rf ios/Pods"
rm -rf Pods
echo "rm -rf ios/Podfile.lock"
rm -rf Podfile.lock
echo "pod deintegrate"
pod deintegrate
echo "bundle clean"
bundle clean --force

echo "bundle install"
bundle install
echo "pod setup"
bundle exec pod setup
echo "pod install"
bundle exec pod install
