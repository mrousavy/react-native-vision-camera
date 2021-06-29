#!/bin/bash
set -e

ROOT=$(pwd)

rm -rf android-npm/*.aar


versions=("0.64.2" "0.63.3")
versions_majors=("64" "63")
total_versions=${#versions[@]}

for (( i=0; i<$total_versions; i++ ));
do

  yarn add "react-native@${versions[$i]}" -D
  for for_hermes in "True" "False"
  do
    engine="jsc"
    if [ "$for_hermes" == "True" ]; then
      engine="hermes"
    fi
    echo "Building VisionCamera for React Native ${versions[$i]} (JS Engine ${engine})..."

    cd android
    ./gradlew clean

    FOR_HERMES=${for_hermes} ./gradlew assembleDebug
    cd ..

    cp android/build/outputs/aar/*.aar "android-npm/react-native-vision-camera-${versions_majors[$i]}-${engine}.aar"
    echo "Built react-native-vision-camera-${versions_majors[$i]}-${engine}.aar!"
  done

done

echo "Finished building VisionCamera packages!"
