#!/bin/bash
set -e

ROOT=$(pwd)

rm -rf android-npm/*.aar

for for_hermes in "True" "False"
do
  engine="jsc"
  if [ "$for_hermes" == "True" ]; then
    engine="hermes"
  fi
  echo "Building VisionCamera for JS Engine ${engine}..."

  cd android
  ./gradlew clean

  FOR_HERMES=${for_hermes} ./gradlew assembleDebug
  cd ..

  cp android/build/outputs/aar/*.aar "android-npm/react-native-vision-camera-${engine}.aar"
  echo "Built react-native-vision-camera-${engine}.aar!"
done

echo "Finished building VisionCamera packages!"
