# Issue #3773 start crash findings

Issue: https://github.com/mrousavy/react-native-vision-camera/issues/3773

Branch: `codex/start-crash-3773`

## Current status

This branch contains an event-driven reproducer in the simple-camera app and an iOS Harness stress test. I have not produced the exact AVFoundation assertion locally or in CI yet. The local multi-physical-camera iPhone 15 Pro became locked and SpringBoard denied further launches, while the available iPhone SE 3rd gen ran the earlier repro loop without crashing. The first CI iOS Harness run also ran the earlier 120-cycle repro on a multi-camera iOS Device Farm device without crashing.

The strongest confirmed root-cause evidence is therefore the original issue stack plus the VisionCamera call ordering below. The original stack proves `AVCaptureSession.startRunning()` overlapped with AVFoundation's private configuration-commit notification path. A separate client report mentions the sibling private assertion `AVCaptureOutput detachFromFigCaptureSession` during rapid `photo -> video -> photo` changes, especially with a filter-preview path involved. That client report is not a stack trace, but it is directionally important because it points at the same output lifetime boundary from the detach side rather than the attach side. The exact assertion conditions inside `-[AVCaptureOutput attachToFigCaptureSession:]` and `detachFromFigCaptureSession` are private Apple code, so the remaining internal invariant is inferred from stacks/logs, not decompiled source.

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

## VisionCamera code path responsible

Native serialization is in `packages/react-native-vision-camera/ios/Hybrid Objects/HybridCameraSession.swift`:

- `configure(...)` uses `Promise.parallel(Self.queue)`, then calls `beginConfiguration()` and `commitConfiguration()`.
- `start()` uses the same `Self.queue`, then calls `session.startRunning()`.
- `stop()` uses the same `Self.queue`, then calls `session.stopRunning()`.

The queue guarantees call order only for VisionCamera's own work. It does not guarantee AVFoundation's private CoreMedia notification queue has finished processing the effects of `commitConfiguration()`.

The high-level React hook path can enqueue `configure()` and `start()` back-to-back during one React update:

- `useCameraController(...)` starts an async `session.configure(...)` effect when outputs or constraints change.
- `useCamera()` then computes `hasController = controller != null`.
- `useCameraSessionIsRunning(session, isActive && hasController)` starts an async `session.start()` effect.

On a reconfiguration update, the previous controller can still be non-null until the new `configure()` resolves. If `isActive` is true in that same commit, React schedules both effects. Since `useCameraController(...)` is called before `useCameraSessionIsRunning(...)`, the native queue receives:

```text
session.configure(new outputs / constraints)
session.start()
```

That is a valid VisionCamera queue order, but it is the exact dangerous order if AVFoundation's `commitConfiguration()` is not a full barrier for its private "make configuration live" work.

## Local reproducer added

`apps/simple-camera/src/screens/CameraScreen.tsx` now has `START_CRASH_REPRO = true`.

The example app starts the camera automatically, then loops from native callbacks:

1. `onStarted` sets `isActive=false`.
2. `onStopped` alternates the active output topology between photo-only and video-only.
3. `onStopped` immediately sets `isActive=true`.
4. The next React commit reconfigures outputs/constraints and restarts without sleeps.

The current loop uses `<SkiaCamera>` so the preview path is a frame output rendered through Skia rather than a native preview output. It alternates `photo -> video -> photo`, alternates `HD_16_9`/`FHD_16_9` video output settings, requests 60 FPS when supported, requests cinematic-extended stabilization during video cycles when supported, and toggles `photoHDR` during photo cycles when supported.

This is intentionally event-driven. It does not use artificial sleeps or timeouts to create the race window.

## Harness reproducer added

`apps/simple-camera/__tests__/visioncamera.start-crash.harness.tsx` now contains two iOS-only stress tests:

```text
cycles photo -> video -> photo outputs through native preview start/stop
cycles photo -> video -> photo outputs with Skia frame-preview attached
```

They render high-level camera components and run 60 cycles of:

```text
onStarted -> inactive
onStopped -> switch photo-only/video-only output topology + toggle constraints + active
```

The first stress test uses the normal `<Camera>` native preview path. The second uses `<SkiaCamera>`, which always adds a frame output for preview rendering and therefore exercises the filter-preview shape mentioned in the newer client report. A crash on CI should appear as an iOS Harness process failure rather than a normal assertion failure.

## Device observations

Local devices seen by `xcrun devicectl list devices`:

- iPhone SE 3rd gen, iOS 26.5, single back wide camera.
- iPhone 15 Pro, iOS 26.5, multi-physical back camera.

Observed locally:

- iPhone SE 3rd gen completed roughly 480 event-driven repro cycles without the AVFoundation assertion.
- iPhone 15 Pro reached roughly 140 cycles in an earlier mixed-log run without the assertion, then the app process ended with exit code 0. I did not find a local crash report for `SimpleCamera`.
- Subsequent iPhone 15 Pro launches were denied because the device was locked: `Unable to launch com.margelo.nitro.camera.example.simple because the device was not, or could not be, unlocked`.
- The attached Teams video shows an app crash alert after an active video recording session, but it does not expose a native stack. It supports the general "active camera plus output/session state changes" trigger shape, not the internal AVFoundation diagnosis by itself.

CI observations from PR #4001 / Harness AWS Device run `27018903509` for the earlier, now-replaced Harness repro:

- Build iOS passed.
- Test iOS executed on a multi-camera iOS device exposing wide, ultra-wide, telephoto, dual, dual-wide, triple, lidar-depth, and true-depth devices.
- The new Harness test completed 120 cycles on `Back Camera` in 25.766s: `reconfigures outputs and immediately restarts from Camera lifecycle callbacks`.
- iOS Harness summary was green: 12 test suites passed, 125 tests passed, 15 skipped, 0 failed.
- The GitHub `Test iOS` job still reported failure because the Device Farm step itself returned failed, but the Harness output did not contain an AVFoundation crash, app crash, failed test, or assertion.
- Android also ran the earlier test and completed 120 cycles in 27.414s. Android failed in unrelated existing suites (`photo`, `coordinates`, `controller`, `video`), not in the Camera-view repro.

Why CI passed: that earlier Harness test was not equivalent to either report. It kept photo and video outputs attached together, then mostly recreated the video output and restarted. It did not remove the photo output before adding video, did not remove video before re-adding photo, did not use the Skia/filter-preview path, did not record video, and did not run on the original iPhone 11 / iOS 18.7.7 matrix. Its green result only proves that "replace video while photo remains attached, then restart" did not hit the assertion on that AWS device in 120 cycles.

Negative evidence: the iPhone SE result and the first iOS Device Farm result suggest the earlier loop was not sufficient to deterministically reproduce the crash. Hardware/OS version, camera topology, recording state, recorder preparation, lens switching, mount/unmount timing, or the narrower photo-only/video-only output transition likely matters.

## Verification done

Commands that passed:

```sh
bun run build
bunx tsc --noEmit --project apps/simple-camera/tsconfig.json
git diff --check
bun --cwd apps/simple-camera react-native bundle --platform ios --dev true --entry-file index.js --bundle-output /tmp/simple-camera-start-crash.bundle --assets-dest /tmp/simple-camera-start-crash-assets --reset-cache
```

`bunx biome check apps/simple-camera/__tests__/visioncamera.start-crash.harness.tsx apps/simple-camera/__tests__/visioncamera.camera-view.harness.tsx apps/simple-camera/src/screens/CameraScreen.tsx START_CRASH_FINDINGS.md apps/simple-camera/__tests__/README.md` reported only pre-existing unused-variable warnings in `CameraScreen.tsx`. The new stress Harness file had no Biome diagnostics.

Local `react-native-harness --harnessRunner ios` tried to boot an iOS simulator, so I stopped it. The simulator is not useful for this camera pipeline race; the PR CI iOS Harness run on real hardware is the relevant signal.

## Current root-cause statement

The best current issue description is:

> VisionCamera can enqueue `AVCaptureSession.startRunning()` immediately after a configuration commit that replaces outputs or changes output-affecting constraints. VisionCamera's own serial queue ensures `startRunning()` happens after `commitConfiguration()` returns, but AVFoundation/CoreMedia may still be processing the committed configuration asynchronously on `FigCaptureSessionNotificationQueue`. On affected hardware/OS combinations, `startRunning()` or a subsequent topology change can overlap that private output attachment/detachment work and trip AVFoundation's internal assertions in `-[AVCaptureOutput attachToFigCaptureSession:]` or `detachFromFigCaptureSession`.

This is proven at the call-order/concurrency level by the crash stack and VisionCamera source. It is not yet proven at the "Apple internal field X had value Y" level because AVFoundation source is private and the exact assertion condition is not visible.

## Next repro iteration

The current repro proves the high-level hook can drive the suspected `configure() -> start()` ordering, but the negative CI result means the original issue likely needs an additional condition. The most likely next conditions to test are:

- actively recording while replacing or recreating the video output,
- preparing a new recorder while the session is being stopped/reconfigured,
- changing zoom across a virtual-device lens switch before the stop/restart cycle,
- switching between virtual multi-camera device IDs instead of only using the default back camera,
- unmounting/remounting `<Camera>` instead of only toggling `isActive`,
- testing on the original crash matrix, especially iPhone 11 on iOS 18.7.7.

## What would count as proof of a fix

A proper fix needs to change the ordering contract, then re-run the same repro loop and Harness test:

- prevent `startRunning()` from being enqueued while a reconfiguration is still becoming live, or
- make the high-level hook clear/withhold the previous controller during reconfiguration so a prop update cannot schedule `configure()` and `start()` in the same React commit, or
- add a native barrier based on a real AVFoundation lifecycle signal if one exists.

Artificial sleeps are not proof. They would only lower the race probability.
