# Issue #3773 start crash findings

Issue: https://github.com/mrousavy/react-native-vision-camera/issues/3773

Branch: `codex/start-crash-3773`

## Current status

This branch contains an event-driven reproducer in the simple-camera app and an iOS Harness stress test. I have not produced the exact AVFoundation assertion locally or in CI yet. The local multi-physical-camera iPhone 15 Pro became locked during the first attempt and later local `run-ios` attempts failed in Xcode before launching the app. The available iPhone SE 3rd gen ran the earlier repro loop without crashing. CI has now run the earlier broad 120-cycle repro, the corrected `photo -> video -> photo` native/Skia topology repro, the active photo/video capture topology repro, and a production-shape photo+video output restart repro on real iOS Device Farm hardware without crashing. A newer active-recorder mutation repro does fail deterministically on CI, but with `AVFoundationErrorDomain Code=-11818 "Recording Stopped"` rather than the private attach/detach assertion.

The strongest confirmed root-cause evidence is therefore the original issue stack plus the VisionCamera call ordering below. The original stack proves `AVCaptureSession.startRunning()` overlapped with AVFoundation's private configuration-commit notification path. A symbol/string pass over local iOS 18.7 and 18.7.1 `AVFCapture` DeviceSupport binaries confirms the private assertion strings for this exact output lifetime boundary: `-[AVCaptureOutput attachToFigCaptureSession:]_block_invoke` asserts `_outputInternal->figCaptureSession == NULL`, while `-[AVCaptureOutput detachFromFigCaptureSession:]_block_invoke` asserts `figCaptureSession == _outputInternal->figCaptureSession`. The reporter's attach-side crash means AVFoundation tried to attach an output object whose internal `figCaptureSession` pointer was already non-null. A separate client report mentions the sibling private assertion `AVCaptureOutput detachFromFigCaptureSession` during rapid `photo -> video -> photo` changes, especially with a filter-preview path involved. That client report is not a stack trace, but it is directionally important because it points at the same output lifetime boundary from the detach side rather than the attach side.

## What the crash stack proves

The crash stack in #3773 has two important concurrent paths:

- One thread is inside `HybridCameraSession.start()` -> `AVCaptureSession.startRunning()` -> AVFoundation graph build.
- Another thread is on `FigCaptureSessionNotificationQueue` inside AVFoundation's configuration-commit notification path, including `_handleConfigurationCommittedNotificationWithPayload`, `_makeConfigurationLive:`, and `-[AVCaptureOutput attachToFigCaptureSession:]`.

That proves VisionCamera had already called `startRunning()` while AVFoundation/CoreMedia was still making a recently committed configuration live on its private notification queue.

Because VisionCamera serializes `configure()` and `start()` on `HybridCameraSession.queue`, this overlap cannot be explained by two VisionCamera calls running at the same time on our queue. The only sequence consistent with the stack is:

1. VisionCamera enters `session.beginConfiguration()`.
2. VisionCamera mutates inputs, outputs, connections, formats, FPS, and stabilization.
3. VisionCamera calls `session.commitConfiguration()`.
4. `commitConfiguration()` returns to VisionCamera before AVFoundation's private "configuration committed" work has fully drained.
5. VisionCamera's next queued `start()` runs and calls `session.startRunning()`.
6. AVFoundation is still attaching outputs from the committed configuration on `FigCaptureSessionNotificationQueue`.
7. AVFoundation hits its private assertion in `attachToFigCaptureSession`.

The newer client report describes `detachFromFigCaptureSession`, which is the same class of invariant violation during output teardown instead of output attachment. Taken together, the evidence points at AVFoundation output attachment/detachment lifetime crossing a session start or a subsequent output topology change. It does not point at JavaScript timing alone, and it does not prove that a single specific output type is always responsible.

Local private-symbol evidence from `/Users/mrousavy/Library/Developer/Xcode/iOS DeviceSupport/iPhone16,1 18.7 (22H20)/Symbols/System/Library/PrivateFrameworks/AVFCapture.framework/AVFCapture` and the matching 18.7.1 DeviceSupport binary:

```text
-[AVCaptureOutput attachToFigCaptureSession:]_block_invoke
AVCaptureOutput.m
_outputInternal->figCaptureSession == NULL
-[AVCaptureOutput detachFromFigCaptureSession:]_block_invoke
figCaptureSession == _outputInternal->figCaptureSession
```

Local disassembly of the iOS 18.7.1 `AVFCapture` binary confirms those strings are the actual branch predicates:

- `-[AVCaptureOutput attachToFigCaptureSession:]` builds a dispatch barrier block on the output's internal queue. The block reads the output internal pointer at offset `0x10`, branches to `___45-[AVCaptureOutput attachToFigCaptureSession:]_block_invoke.cold.1` if it is non-null, otherwise stores the incoming FigCaptureSession pointer there and then calls `attachSafelyToFigCaptureSession:`.
- `-[AVCaptureOutput detachFromFigCaptureSession:]` uses the same dispatch barrier shape. The block compares the incoming FigCaptureSession pointer to the output internal pointer at offset `0x10`, branches to `___47-[AVCaptureOutput detachFromFigCaptureSession:]_block_invoke.cold.1` if they differ, otherwise clears that internal pointer to null and then calls `detachSafelyFromFigCaptureSession:`.
- `_makeConfigurationLive:` first computes unique inputs/outputs/preview layers from the old and new `AVCaptureSessionConfiguration`s, calls `detachFromFigCaptureSession:` for old preview layers, then calls `attachToFigCaptureSession:` for new preview layers. Around the unique input/output sets it also calls `makeObjectsPerformSelector:withObject:` with the same old/new FigCaptureSession pointer. This matches the reporter stack: `_handleConfigurationCommittedNotificationWithPayload:` calls `_makeConfigurationLive:`, which makes the output attachment live on `FigCaptureSessionNotificationQueue`.
- The same symbol table exposes separate `AVCaptureSessionInternal` fields for `committedAVCaptureSessionConfigurations`, `liveAVCaptureSessionConfiguration`, and `waitingForFigCaptureSessionConfigurationToBecomeLive`. That makes the important lifecycle split explicit: a configuration can be committed before it is live.

This is not source-level decompilation, and it is not the exact iPhone 11 / iOS 18.7.7 binary from the issue. It is still stronger than a guess: the assertion predicates and attachment order are visible in nearby iOS 18.7.x AVFCapture binaries and match the stack functions in #3773.

## VisionCamera code path responsible

Native serialization is in `packages/react-native-vision-camera/ios/Hybrid Objects/HybridCameraSession.swift`:

- `configure(...)` uses `Promise.parallel(Self.queue)`, then calls `beginConfiguration()` and `commitConfiguration()`.
- `start()` uses the same `Self.queue`, then calls `session.startRunning()`.
- `stop()` uses the same `Self.queue`, then calls `session.stopRunning()`.

The queue guarantees call order only for VisionCamera's own work. It does not guarantee AVFoundation's private CoreMedia notification queue has finished processing the effects of `commitConfiguration()`.

The active recording path involved in the latest repro is in:

- `HybridCameraVideoOutput` creates a non-persistent `AVCaptureMovieFileOutput`.
- `HybridVideoRecorder.startRecording(...)` calls `AVCaptureMovieFileOutput.startRecording(...)`.
- `VideoDelegate.fileOutput(... didFinishRecordingTo: ... error:)` treats only max-duration and max-file-size errors as successful finishes. The latest repro receives AVFoundation's `AVErrorRecordingSuccessfullyFinishedKey=true` with `AVFoundationErrorDomain Code=-11818 "Recording Stopped"` and underlying `NSOSStatusErrorDomain Code=-16414`, which VisionCamera surfaces through `onRecordingError`.

The high-level React hook path can enqueue `configure()` and `start()` back-to-back during one React update:

- `useCameraController(...)` starts an async `session.configure(...)` effect when outputs or constraints change.
- `useCamera()` then computes `hasController = controller != null`.
- `useCameraSessionIsRunning(session, isActive && hasController)` starts an async `session.start()` effect.

On a reconfiguration update, `useCameraController(...)` does not clear the previous controller before starting the new async `session.configure(...)`. The previous controller can therefore remain non-null until the new `configure()` resolves. If `isActive` is true in that same commit, React schedules both effects. Since `useCameraController(...)` is called before `useCameraSessionIsRunning(...)`, the native queue receives:

```text
session.configure(new outputs / constraints)
session.start()
```

That is a valid VisionCamera queue order, but it is the exact dangerous order if AVFoundation's `commitConfiguration()` is not a full barrier for its private "make configuration live" work.

The imperative controller path from the reporter repro is less suspicious than the output/session path. `HybridCameraController` is initialized with `HybridCameraSession.Self.queue`; `setZoom`, `focusTo`, `setExposureBias`, `setTorchMode`, and the controller `configure(...)` all lock the `AVCaptureDevice` on that same queue. Those calls are therefore serialized with VisionCamera's own `configure/start/stop` work. They may still cause AVFoundation/CoreMedia to do additional private work after the lock is released, but they are not concurrent VisionCamera queue mutations.

## Reporter repro repo comparison

The #3773 reporter provided `https://github.com/qutrek/vision-camera-v5-attach-race-repro`. I cloned it to `/tmp/vision-camera-v5-attach-race-repro` and inspected `src/camera/CameraModal.tsx`.

Important production-shape details from that repro:

- Only one `<Camera>` is mounted.
- There are no frame processors in the reporter repro.
- `photoOutput` and `videoOutput` stay attached together as `[photoOutput, videoOutput]`.
- Toggling mute recreates `videoOutput` because `enableAudio: !isMuted` changes.
- Toggling HDR changes the constraints array with 60 FPS, cinematic-extended stabilization, optional `photoHDR`, and optional HDR video dynamic range.
- Video capture creates a fresh single-use recorder, calls `startRecording(...)`, then later `stopRecording()` or `cancelRecording()`.
- Video review uses `pendingMedia`, which drives `isActive=false`; retake sets `pendingMedia=null`, so the same mounted `<Camera>` restarts.
- Multi-photo capture keeps the camera active and appends to `pendingPhotos`.
- `onCameraStarted` reapplies torch, exposure, and zoom imperatively.
- Zoom preset changes can cross virtual-device lens-switch factors while the session is active.

Current Harness coverage matches the stable `[photoOutput, videoOutput]`, mute-output recreation, HDR-video dynamic range, zoom-on-start, video recording, video-retake active restart, and reporter-style active-session control mutation pieces. It still does not cover exact iPhone 11 / iOS 18.7.7 hardware/OS behavior.

## Local reproducer added

`apps/simple-camera/src/screens/CameraScreen.tsx` now has `START_CRASH_REPRO = true`.

The example app starts the camera automatically, then loops from native callbacks:

1. `onStarted` runs actual capture work for the current mode.
2. Photo cycles call `capturePhoto(...)` and dispose the returned `Photo`.
3. Video cycles create a recorder, start recording, and stop recording immediately after `startRecording(...)` resolves.
4. The capture cycle then sets `isActive=false`.
5. `onStopped` alternates the active output topology between photo-only and video-only.
6. `onStopped` immediately sets `isActive=true`.
7. The next React commit reconfigures outputs/constraints and restarts without sleeps.

The current loop uses `<SkiaCamera>` so the preview path is a frame output rendered through Skia rather than a native preview output. It alternates `photo -> video -> photo`, alternates `HD_16_9`/`FHD_16_9` video output settings, requests 60 FPS when supported, requests cinematic-extended stabilization during video cycles when supported, and toggles `photoHDR` during photo cycles when supported.

This is intentionally event-driven. It does not use artificial sleeps or timeouts to create the race window.

## Harness reproducer added

`apps/simple-camera/__tests__/visioncamera.start-crash.harness.tsx` now contains six iOS-only stress tests:

```text
cycles photo -> video -> photo outputs through native preview start/stop
cycles photo -> video -> photo outputs with Skia frame-preview attached
captures photo -> records video -> captures photo with Skia frame-preview attached
restarts with stable photo/video outputs while toggling audio, HDR, and zoom
recreates video output while recording with Skia frame-preview attached
mutates reporter-style active controls while reconfiguring outputs
```

The first two tests render high-level camera components and run 60 cycles of:

```text
onStarted -> inactive
onStopped -> switch photo-only/video-only output topology + toggle constraints + active
```

The first stress test uses the normal `<Camera>` native preview path. The second uses `<SkiaCamera>`, which always adds a frame output for preview rendering and therefore exercises the filter-preview shape mentioned in the newer client report.

The third test keeps the Skia preview path and runs 18 cycles of real capture activity:

```text
photo mode -> capturePhoto -> inactive
video mode -> create recorder -> startRecording -> stopRecording -> inactive
onStopped -> switch photo-only/video-only output topology + active
```

The fourth test is closer to the production code in #3773. It keeps both photo and video outputs attached as `[photoOutput, videoOutput]`, recreates the video output by toggling `enableAudio`, toggles `photoHDR` plus HDR video dynamic range when supported, applies zoom targets across the virtual-device zoom range from `onStarted`, and immediately restarts from `onStopped`.

The fifth test targets the active recording teardown boundary more directly. It keeps the Skia/filter-preview path attached, starts a real recorder, recreates the video output by toggling `enableAudio` while that recorder is still active, waits for `onSessionConfigSelected` from the reconfiguration, then stops the old recorder and restarts the camera from `onStopped`. After CI proved AVFoundation forcibly stops the active recording with `AVFoundationErrorDomain Code=-11818`, the current version treats that specific forced stop as an observed event and continues cycling.

The sixth test targets the reporter repro's active-session interaction pattern. It keeps the native preview `<Camera>` active, keeps `[photoOutput, videoOutput]` attached, fires zoom/focus/exposure/torch updates through public Camera APIs, then toggles `enableAudio`, HDR constraints, and occasionally front/back device selection. It advances from `onStarted` and `onConfigured`, not from sleeps.

A crash on CI should appear as an iOS Harness process failure rather than a normal assertion failure.

## Device observations

Local devices seen by `xcrun devicectl list devices`:

- iPhone SE 3rd gen, iOS 26.5, single back wide camera.
- iPhone 15 Pro, iOS 26.5, multi-physical back camera.

Observed locally:

- iPhone SE 3rd gen completed roughly 480 event-driven repro cycles without the AVFoundation assertion.
- iPhone 15 Pro reached roughly 140 cycles in an earlier mixed-log run without the assertion, then the app process ended with exit code 0. I did not find a local crash report for `SimpleCamera`.
- Subsequent iPhone 15 Pro launches were denied because the device was locked: `Unable to launch com.margelo.nitro.camera.example.simple because the device was not, or could not be, unlocked`.
- Later iPhone 15 Pro launch attempts on the same branch failed before app launch with `xcodebuild` exit code 65 and a final linker failure. The latest run also showed unavailable C++ `std::error_code` / `std::error_condition` imports while compiling Pods. Those local runs did not exercise the camera repro.
- The attached Teams video shows an app crash alert after an active video recording session, but it does not expose a native stack. It supports the general "active camera plus output/session state changes" trigger shape, not the internal AVFoundation diagnosis by itself.

CI observations from PR #4001 / Harness AWS Device run `27018903509` for the earlier, now-replaced Harness repro:

- Build iOS passed.
- Test iOS executed on a multi-camera iOS device exposing wide, ultra-wide, telephoto, dual, dual-wide, triple, lidar-depth, and true-depth devices.
- The new Harness test completed 120 cycles on `Back Camera` in 25.766s: `reconfigures outputs and immediately restarts from Camera lifecycle callbacks`.
- iOS Harness summary was green: 12 test suites passed, 125 tests passed, 15 skipped, 0 failed.
- The GitHub `Test iOS` job still reported failure because the Device Farm step itself returned failed, but the Harness output did not contain an AVFoundation crash, app crash, failed test, or assertion.
- Android also ran the earlier test and completed 120 cycles in 27.414s. Android failed in unrelated existing suites (`photo`, `coordinates`, `controller`, `video`), not in the Camera-view repro.

Why CI passed: that earlier Harness test was not equivalent to either report. It kept photo and video outputs attached together, then mostly recreated the video output and restarted. It did not remove the photo output before adding video, did not remove video before re-adding photo, did not use the Skia/filter-preview path, did not record video, and did not run on the original iPhone 11 / iOS 18.7.7 matrix. Its green result only proves that "replace video while photo remains attached, then restart" did not hit the assertion on that AWS device in 120 cycles.

CI observations from PR #4001 / Harness AWS Device run `27022466051` on commit `aa4456ce71f6a81a9dab7c89de1c7c69604c15ff`:

- Build iOS passed.
- Test iOS executed on Apple iPhone 16 Pro.
- The corrected start-crash stress file passed: 60 native preview topology cycles completed in 13.257s and 60 Skia topology cycles completed in 13.668s.
- iOS Harness summary was green: 13 test suites passed, 126 tests passed, 15 skipped, 0 failed.
- The GitHub `Test iOS` job still reported failure because AWS Device Farm reported one failed item outside the Harness summary: `Total: 3, passed: 2, failed: 1`. The printed Harness output did not contain an AVFoundation crash, app crash, failed test, `attachToFigCaptureSession`, or `detachFromFigCaptureSession`.

CI observations from PR #4001 / Harness AWS Device run `27023974149` on commit `eab8faca6403e5d91ef84c98c627f97fef90ee75`:

- Build iOS passed.
- Test iOS executed on Apple iPhone 16 Pro.
- The active capture stress test passed: 18 Skia cycles completed in 7.838s.
- iOS Harness summary was green: 13 test suites passed, 127 tests passed, 15 skipped, 0 failed.
- The GitHub `Test iOS` job still reported failure because AWS Device Farm reported one failed item outside the Harness summary: `Total: 3, passed: 2, failed: 1`.
- The printed Harness output did not contain an AVFoundation crash, app crash, failed test, `attachToFigCaptureSession`, or `detachFromFigCaptureSession`.

CI observations from PR #4001 / Harness AWS Device run `27025713494` on commit `41d3378c3b4ca3684cdd80b889b2974a9148d5c8`:

- Build iOS passed.
- Test iOS executed on Apple iPhone 16 Pro.
- The complete start-crash stress file passed:
  - 60 native preview topology cycles completed in 13.139s.
  - 60 Skia topology cycles completed in 13.519s.
  - 18 active capture/record cycles completed in 7.734s.
  - 80 production-shape restart cycles completed in 20.028s.
- The production-shape test kept `[photoOutput, videoOutput]` attached, toggled `enableAudio`, toggled HDR video dynamic range when supported, applied zoom from `onStarted`, and immediately restarted from `onStopped`.
- The iPhone 16 Pro back devices in this run reported `supportsPhotoHDR: false` and `hdrRanges: 6`, so this run exercised video HDR dynamic range toggling but not actual photo HDR enablement.
- iOS Harness summary was green: 13 test suites passed, 128 tests passed, 15 skipped, 0 failed.
- The GitHub `Test iOS` job still reported failure because AWS Device Farm reported one failed item outside the Harness summary: `Total: 3, passed: 2, failed: 1`.
- The printed Harness output did not contain an AVFoundation crash, app crash, failed test, `AVCaptureOutput`, `attachToFigCaptureSession`, or `detachFromFigCaptureSession`.

CI observations from PR #4001 / Harness AWS Device run `27027231154` on commit `62f9c32a855afa3b431454e518ceeed28f933c0d`:

- Build iOS passed.
- Test iOS executed on Apple iPhone 16 Pro.
- The first four start-crash stress tests still passed:
  - 60 native preview topology cycles completed in 13.509s.
  - 60 Skia topology cycles completed in 13.392s.
  - 18 active capture/record cycles completed in 7.877s.
  - 80 production-shape restart cycles completed in 19.825s.
- The new active-recorder mutation test failed in 627ms:
  - `recreates video output while recording with Skia frame-preview attached`.
  - Error: `AVFoundationErrorDomain Code=-11818 "Recording Stopped"`.
  - User info includes `AVErrorRecordingSuccessfullyFinishedKey=true`.
  - Recovery suggestion: `Stop any other actions using the recording device and try again.`
  - Underlying error: `NSOSStatusErrorDomain Code=-16414`.
- iOS Harness summary was red: 1 failed suite, 1 failed test, 128 passed, 15 skipped, 144 total.
- The printed Harness output did not contain an app crash, `AVCaptureOutput`, `attachToFigCaptureSession`, or `detachFromFigCaptureSession`.

Positive evidence: mutating/recreating the non-persistent video output while an `AVCaptureMovieFileOutput` recording is active is invalid on AVFoundation. AVFoundation forcibly stops that recording immediately. This is a concrete, deterministic reproduction of the dangerous output-lifetime boundary, but it is not yet the original private attach/detach assertion.

The first implementation of this test intentionally failed on that forced stop. The current branch version now treats only this specific `Code=-11818` + `AVErrorRecordingSuccessfullyFinishedKey=true` result as an expected forced-stop event, then continues the stress loop to test the restart/finalization window that follows the forced stop.

CI observations from PR #4001 / Harness AWS Device run `27029008264` on commit `2f9ac85da8845983d57c349c7879ae641a522e0f`:

- Build iOS passed.
- Test iOS executed on Apple iPhone 16 Pro.
- The five pushed start-crash stress tests all passed:
  - 60 native preview topology cycles completed in 13.153s.
  - 60 Skia topology cycles completed in 13.330s.
  - 18 active capture/record cycles completed in 7.843s.
  - 80 production-shape restart cycles completed in 19.748s.
  - 12 active-recorder mutation cycles completed in 10.864s, with 12 forced recording stops.
- iOS Harness summary was green: 13 test suites passed, 129 tests passed, 15 skipped, 144 total.
- The GitHub `Test iOS` job still reported failure because AWS Device Farm reported `FAILED` outside the Harness summary and the wrapper exited with code 1.
- The printed Harness output did not contain an app crash, `AVCaptureOutput`, `attachToFigCaptureSession`, `detachFromFigCaptureSession`, `SIGABRT`, or `EXC_`.

CI observations from PR #4001 / Harness AWS Device run `27030309527` on commit `695e1fe3cc4ab510a67072279b97eae500e348bd`:

- Build iOS passed.
- Test iOS executed on Apple iPhone 16 Pro.
- The six pushed start-crash stress tests all passed:
  - 60 native preview topology cycles completed in 13.720s.
  - 60 Skia topology cycles completed in 12.624s.
  - 18 active capture/record cycles completed in 7.512s.
  - 80 production-shape restart cycles completed in 19.208s.
  - 12 active-recorder mutation cycles completed in 10.414s, with 12 forced recording stops.
  - 80 reporter-style active interaction cycles completed in 15.163s.
- iOS Harness summary was green: 13 passed suites, 130 passed tests, 15 skipped, 145 total, time 326.018s.
- The GitHub `Test iOS` job still reported failure because AWS Device Farm reported `FAILED` outside the Harness summary and the wrapper exited with code 1.
- The active-interaction test produced expected/tolerated focus metering cancellation/timeouts and torch rejections on a no-torch device. These were control API failures, not session errors.
- The printed Harness output did not contain an app crash, `AVCaptureOutput`, `attachToFigCaptureSession`, `detachFromFigCaptureSession`, `AVFoundationErrorDomain`, `SIGABRT`, or `EXC_`.

Negative evidence: the iPhone SE result and the first six iOS Device Farm results suggest simple output topology changes, immediate active capture/recording cycles, production-shape photo+video output recreation across restarts, active-recorder output mutation, continuing after AVFoundation forced recording stops, and reporter-style active control mutation are not sufficient to deterministically reproduce the crash on the tested hardware/OS. Hardware/OS version, camera topology, actual photo HDR enablement, lens switching during recording/capture, mount/unmount timing, TestFlight/release timing, or the original iPhone 11 / iOS 18.7.7 matrix likely still matters.

## Verification done

Commands that passed:

```sh
bun run build
bunx tsc --noEmit --project apps/simple-camera/tsconfig.json
git diff --check
bun --cwd apps/simple-camera react-native bundle --platform ios --dev true --entry-file index.js --bundle-output /tmp/simple-camera-start-crash.bundle --assets-dest /tmp/simple-camera-start-crash-assets --reset-cache
xcrun nm -m "/Users/mrousavy/Library/Developer/Xcode/iOS DeviceSupport/iPhone16,1 18.7.1 (22H31)/Symbols/System/Library/PrivateFrameworks/AVFCapture.framework/AVFCapture" | rg "attachToFigCaptureSession|detachFromFigCaptureSession|_makeConfigurationLive|_handleConfigurationCommittedNotification"
xcrun nm -m "/Users/mrousavy/Library/Developer/Xcode/iOS DeviceSupport/iPhone16,1 18.7.1 (22H31)/Symbols/System/Library/PrivateFrameworks/AVFCapture.framework/AVFCapture" | rg "AVCaptureSessionInternal"
strings -a "/Users/mrousavy/Library/Developer/Xcode/iOS DeviceSupport/iPhone16,1 18.7.1 (22H31)/Symbols/System/Library/PrivateFrameworks/AVFCapture.framework/AVFCapture" | rg "attachToFigCaptureSession|detachFromFigCaptureSession|figCaptureSession|AVCaptureOutput\\.m"
strings -a "/Users/mrousavy/Library/Developer/Xcode/iOS DeviceSupport/iPhone16,1 18.7 (22H20)/Symbols/System/Library/PrivateFrameworks/AVFCapture.framework/AVFCapture" | rg "AVCaptureOutput\\.m|_outputInternal->figCaptureSession == NULL|figCaptureSession == _outputInternal->figCaptureSession|attachToFigCaptureSession|detachFromFigCaptureSession"
xcrun llvm-objdump --arch-name=arm64 --start-address=0x1a1d0fd6c --stop-address=0x1a1d0fe20 -d "/Users/mrousavy/Library/Developer/Xcode/iOS DeviceSupport/iPhone16,1 18.7.1 (22H31)/Symbols/System/Library/PrivateFrameworks/AVFCapture.framework/AVFCapture"
xcrun llvm-objdump --arch-name=arm64 --start-address=0x1a1d527f8 --stop-address=0x1a1d528c0 -d "/Users/mrousavy/Library/Developer/Xcode/iOS DeviceSupport/iPhone16,1 18.7.1 (22H31)/Symbols/System/Library/PrivateFrameworks/AVFCapture.framework/AVFCapture"
xcrun llvm-objdump --arch-name=arm64 --start-address=0x1a1d27c30 --stop-address=0x1a1d28080 -d "/Users/mrousavy/Library/Developer/Xcode/iOS DeviceSupport/iPhone16,1 18.7.1 (22H31)/Symbols/System/Library/PrivateFrameworks/AVFCapture.framework/AVFCapture" > /tmp/avfcapture_make_live_disasm.txt
```

`bunx biome check apps/simple-camera/__tests__/visioncamera.start-crash.harness.tsx apps/simple-camera/__tests__/visioncamera.camera-view.harness.tsx apps/simple-camera/src/screens/CameraScreen.tsx START_CRASH_FINDINGS.md apps/simple-camera/__tests__/README.md` reported only pre-existing unused-variable warnings in `CameraScreen.tsx`. The new stress Harness file had no Biome diagnostics.

Local `react-native-harness --harnessRunner ios` tried to boot an iOS simulator, so I stopped it. The simulator is not useful for this camera pipeline race; the PR CI iOS Harness run on real hardware is the relevant signal.

## Current root-cause statement

The best current issue description is:

> VisionCamera can enqueue `AVCaptureSession.startRunning()` immediately after a configuration commit that replaces outputs or changes output-affecting constraints. VisionCamera's own serial queue ensures `startRunning()` happens after `commitConfiguration()` returns, but AVFoundation/CoreMedia may still be processing the committed configuration asynchronously on `FigCaptureSessionNotificationQueue`. On affected hardware/OS combinations, `startRunning()` or a subsequent topology change can overlap that private output attachment/detachment work. The attach-side assertion is `_outputInternal->figCaptureSession == NULL`, so the #3773 crash means AVFoundation tried to attach an output object whose internal Fig session pointer was already set. The detach-side sibling asserts that the Fig session being detached must equal the output's currently attached Fig session.

The active-recorder mutation result adds one concrete sub-cause:

> If JS recreates the video output, for example by toggling `enableAudio`, while a non-persistent `AVCaptureMovieFileOutput` recorder is active, AVFoundation forcibly stops the recording with `AVFoundationErrorDomain Code=-11818 "Recording Stopped"` and underlying `NSOSStatusErrorDomain Code=-16414`. That proves the output replacement crosses an AVFoundation recording lifetime boundary even before the private attach/detach assertion is hit.

This is proven at the call-order/concurrency level by the crash stack and VisionCamera source, at the private-invariant level by the local AVFCapture assertion strings, and at the active-recording lifetime level by the failing Harness run. The exact Apple control-flow path that leaves the output pointer non-null is still not proven because AVFoundation source is private and the exact issue device binary is not available.

## Next repro iteration

The current repro proves the high-level hook can drive the suspected `configure() -> start()` ordering, and the active-recorder mutation test now proves the non-persistent video output cannot be replaced during an active `AVCaptureMovieFileOutput` recording without AVFoundation forcibly stopping the recording. The current Harness iterations continue after that forced stop and also cover reporter-style active-session interaction. If those still do not crash, the most likely remaining conditions to test are:

- immediately changing device or zoom after AVFoundation forcibly stops the interrupted recording,
- actual photo HDR enablement on a device where `supportsPhotoHDR` is true,
- switching between virtual multi-camera device IDs instead of only using the default back camera,
- unmounting/remounting `<Camera>` instead of only toggling `isActive`,
- testing on the original crash matrix, especially iPhone 11 on iOS 18.7.7.

## What would count as proof of a fix

A proper fix needs to change the ordering contract, then re-run the same repro loop and Harness test:

- prevent `startRunning()` from being enqueued while a reconfiguration is still becoming live, or
- make the high-level hook clear/withhold the previous controller during reconfiguration so a prop update cannot schedule `configure()` and `start()` in the same React commit, or
- add a native barrier based on a real AVFoundation lifecycle signal if one exists.

Artificial sleeps are not proof. They would only lower the race probability.
