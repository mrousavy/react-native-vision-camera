#!/usr/bin/env bash
set -euo pipefail

APP_APK_PATH="./android/app/build/outputs/apk/debug/app-debug.apk"
BUNDLE_ID="${HARNESS_ANDROID_BUNDLE_ID:?HARNESS_ANDROID_BUNDLE_ID is required}"
APP_ACTIVITY="${HARNESS_ANDROID_MAIN_ACTIVITY:-${BUNDLE_ID}/.MainActivity}"
STARTUP_TIMEOUT_SECONDS="${HARNESS_ANDROID_STARTUP_TIMEOUT_SECONDS:-60}"
HARNESS_TIMEOUT_SECONDS="${HARNESS_ANDROID_TEST_TIMEOUT_SECONDS:-720}"

echo "Waiting for emulator..."
adb wait-for-device

echo "Installing APK from ${APP_APK_PATH}..."
adb install -r "${APP_APK_PATH}"

echo "Granting runtime permissions for ${BUNDLE_ID}..."
adb shell settings put secure location_mode 3 || true
adb shell pm grant "${BUNDLE_ID}" android.permission.CAMERA || true
adb shell pm grant "${BUNDLE_ID}" android.permission.RECORD_AUDIO || true
adb shell pm grant "${BUNDLE_ID}" android.permission.ACCESS_FINE_LOCATION || true
adb shell pm grant "${BUNDLE_ID}" android.permission.ACCESS_COARSE_LOCATION || true

echo "Runtime permissions:"
adb shell dumpsys package "${BUNDLE_ID}" | awk '/runtime permissions:/{flag=1} flag{print} /^\s*$/{if(flag){exit}}' || true

echo "Checking app startup..."
adb logcat -c || true
adb shell am force-stop "${BUNDLE_ID}" || true
adb shell am start -W -n "${APP_ACTIVITY}"

launch_deadline=$((SECONDS + STARTUP_TIMEOUT_SECONDS))
while true; do
  if adb shell pidof "${BUNDLE_ID}" | tr -d '\r' | grep -Eq '[0-9]+'; then
    break
  fi

  if (( SECONDS >= launch_deadline )); then
    echo "App ${BUNDLE_ID} did not start within ${STARTUP_TIMEOUT_SECONDS}s."
    adb logcat -d -b crash || true
    exit 1
  fi

  sleep 2
done

# Ensure the process does not die immediately after launch.
sleep 5
if ! adb shell pidof "${BUNDLE_ID}" | tr -d '\r' | grep -Eq '[0-9]+'; then
  echo "App ${BUNDLE_ID} crashed shortly after launch."
  adb logcat -d -b crash || true
  exit 1
fi

adb shell am force-stop "${BUNDLE_ID}" || true

echo "Running harness tests (hard timeout: ${HARNESS_TIMEOUT_SECONDS}s)..."
set +e
timeout --foreground --kill-after=30s "${HARNESS_TIMEOUT_SECONDS}" bun run test:harness:android
exit_code=$?
set -e

if [[ "${exit_code}" -eq 124 ]]; then
  echo "Harness tests exceeded ${HARNESS_TIMEOUT_SECONDS}s and were aborted."
  exit 1
fi

exit "${exit_code}"
