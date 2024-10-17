#!/bin/bash

echo "rm -rf node_modules"
rm -rf node_modules
echo "rm -rf yarn.lock"
rm -rf yarn.lock
rm -rf package-lock.json

echo "rm -rf ~/Library/Caches/CocoaPods"
rm -rf ~/Library/Caches/CocoaPods
echo "rm -rf ios/Pods"
rm -rf ios/Pods
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
echo "pod setup"
pod setup
echo "yarn"
yarn
echo "pod install"
pod install
