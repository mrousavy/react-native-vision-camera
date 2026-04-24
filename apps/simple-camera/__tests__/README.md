# VisionCamera Harness Tests

This folder contains the on-device test suite for the VisionCamera imperative
API. Tests run on a real phone (local `adb` device or an AWS Device Farm
device) through [react-native-harness], which embeds a Jest-compatible runner
in the `simple-camera` app and talks to it over a Metro-driven bridge.

---

## Why these tests exist

Two goals, in order:

1. **Regressions in the public API surface fail CI automatically.** Every
   feature of `VisionCamera` that this library supports on real hardware has a
   test here. If a refactor breaks `capturePhoto`, the CI run turns red on the
   next PR.
2. **Bug reports become executable.** Anyone who finds a bug is expected to
   open a PR here that adds a single failing test reproducing the issue —
   **not** a separate reproduction repo. The maintainer fixes the bug on the
   same branch until the CI goes green, and the test is merged along with
   the fix. That way the same bug can never regress silently again.

**If you are reporting a bug:** open a PR that adds the smallest possible
`it(...)` block somewhere under this folder, aligned with the rules below.
Then open the issue referencing the PR — the CI run on the PR is the
reproduction. You do **not** need to create a separate repo.

---

## Layout

Tests are split by domain. Each file tests one slice of the imperative
`VisionCamera` API:

| File | Covers |
|------|--------|
| [visioncamera.devices.harness.ts](visioncamera.devices.harness.ts) | `VisionCamera.createDeviceFactory`, device enumeration, per-device capabilities, `getCameraForId`, `addOnCameraDevicesChangedListener`, `getSupportedExtensions`, `userPreferredCamera` |
| [visioncamera.session.harness.ts](visioncamera.session.harness.ts) | `createCameraSession`, `configure`, `start`, `stop`, `addOnStartedListener` / `addOnStoppedListener` / `addOnErrorListener` / interruption listeners, reconfigure-while-running, multi-cam |
| [visioncamera.photo.harness.ts](visioncamera.photo.harness.ts) | `createPhotoOutput`, `capturePhoto` / `capturePhotoToFile`, container formats (JPEG, HEIC, DNG), flash / mirror / quality / resolution options, capture lifecycle callbacks, preview images |
| [visioncamera.video.harness.ts](visioncamera.video.harness.ts) | `createVideoOutput`, `Recorder` lifecycle, audio, `maxDuration` / `maxFileSize` stops, pause / resume / cancel, persistent recorder, higher-resolution codecs |
| [visioncamera.frame.harness.ts](visioncamera.frame.harness.ts) | `createFrameOutput`, worklet install via `react-native-vision-camera-worklets`, YUV / RGB / native pixel formats, `scheduleOnRN`, `createSynchronizable`, `setOnFrameDroppedCallback`, `allowPhysicalBufferResizing` |
| [visioncamera.constraints.harness.ts](visioncamera.constraints.harness.ts) | `VisionCamera.resolveConstraints` + `onSessionConfigSelected`, FPS / HDR / stabilization / binned / pixelFormat / resolutionBias constraints |
| [visioncamera.controller.harness.ts](visioncamera.controller.harness.ts) | `CameraController` — zoom, torch, exposure bias, focus metering, low-light boost, subject area listener |

Pick the file that best matches what you're testing. If you're reproducing a
bug that spans multiple outputs, put it in the file most central to the
failure. If nothing fits, open a new `visioncamera.<domain>.harness.ts` —
Jest picks up anything matching `__tests__/**/*.harness.{ts,tsx}`.

---

## How a test is written

The contract is deliberately strict so that the tests read exactly like
VisionCamera user code — contributors and LLMs should be able to drop in a
reproduction without having to learn framework-specific helpers.

### 1. Use the `VisionCamera` API as-is. **No helpers.**

Every test builds up its session inline, end-to-end, from `VisionCamera` up.
Do **not** extract helpers like `createSession()` or `configureAndStart()` —
the API should read in tests exactly as users would write it in their app.

```ts
it('captures a JPEG Photo in-memory', async () => {
  const session = await VisionCamera.createCameraSession(false)
  const photoOutput = VisionCamera.createPhotoOutput({
    targetResolution: CommonResolutions.FHD_4_3,
    containerFormat: 'jpeg',
    quality: 0.9,
    qualityPrioritization: 'balanced',
  })
  await session.configure([
    {
      input: backDevice,
      outputs: [{ output: photoOutput, mirrorMode: 'auto' }],
      constraints: [],
    },
  ])
  await session.start()

  const photo = await photoOutput.capturePhoto(
    { flashMode: 'off', enableShutterSound: false },
    {},
  )
  expect(photo.width).toBeGreaterThan(0)
  expect(photo.containerFormat).toBe('jpeg')
  photo.dispose()

  await session.stop()
})
```

**`beforeAll` may cache trivial API results** (e.g. the `CameraDeviceFactory`
and the default back / front `CameraDevice`). It must not wrap any camera
session setup — every `it` block gets its own `session`, `photoOutput`, etc.

### 2. Hard vs. soft requirements

Cameras differ. A failing hard requirement is a real bug; a missing soft
feature is a device limitation and should not fail the test.

- **Hard requirement** — checked with `expect(...)`, makes the test fail.
  Examples: a back camera exists; a photo output produces a photo with
  `width > 0`; `session.configure` returns one controller per connection.
- **Soft requirement** — gated by the matching capability flag and a
  `console.log('[SKIP] <what>: <reason>')` early-return when not supported.
  The skip log is deliberately visible in CI so we can see what the current
  test device can't cover and pick a different device if needed.

```ts
if (!backDevice.supportsPhotoHDR) {
  console.log('[SKIP] photoHDR: not supported on this device')
  return
}
// hard-assert HDR behavior from here on
```

Capability flags live on `CameraDevice` (`hasFlash`, `hasTorch`,
`supportsFocusMetering`, `supportsExposureBias`, `supportsPhotoHDR`,
`supportsFPS(n)`, `supportsVideoStabilizationMode('cinematic')`, etc.) and on
`VisionCamera` (`supportsMultiCamSessions`). Use them. Do **not** introduce
ad-hoc try/catch wrappers around an operation just to silently skip it — if
there is no way to query support upfront, flag that as a missing API (see
"Known API gaps" below) and `it.skip` the test with a TODO explaining what
would let you turn it into a hard requirement.

### 3. Test behavior, not types

Nitro Modules enforce types at the bridge already. Skip `typeof x === 'number'`
or `Array.isArray(devices)` assertions — they only add noise. Assert things
that require the device actually doing camera work.

### 4. Prefer callbacks over polled state

`session.isRunning` updates asynchronously on Android. Wait for
`session.addOnStartedListener(...)` and `addOnStoppedListener(...)` using
`waitUntil(() => started, { timeout: 10_000 })` instead of polling `isRunning`
in a sleep loop.

### 5. Don't silently swallow errors

No `.catch(() => undefined)` around otherwise-expected-to-succeed calls. If
`session.stop()` can throw, the test should fail — that's a regression. Only
add a `try { ... } catch { console.log('[SKIP] ...') }` when you genuinely
cannot gate the code path any other way (see the HEIC / DNG photo tests — no
API exposes which container formats the device supports).

### 6. Dispose only when it matters

`Photo`, `Frame`, and `Image` hold large native buffers — call `.dispose()`
as soon as you're done with them. You do **not** need to dispose
`CameraSession`, `CameraController`, or outputs in tests; the JS runtime GC
frees them between tests.

### 7. No artificial `setTimeout` delays

Tests must only wait on events they actually depend on
(`session.addOnStartedListener`, `onRecordingFinished`, a frame counter, a
`CompletableDeferred`). Sleeping a random number of milliseconds "so the
camera settles" introduces flakiness and masks real regressions. If you
catch yourself writing `await sleep(500)` to "make it work", treat it as a
bug to fix, not a patch to keep.

### 8. Platform guards

iOS-only features (`setFocusLocked`, `setExposureLocked`, `continuity
camera`, `getSupportedVideoCodecs`, etc.) and Android-only features
(`enableHigherResolutionCodecs`) should start with a
`if (Platform.OS !== 'ios') { console.log('[SKIP] ...: iOS only'); return }`
guard. Do not branch on `Platform.OS` to mask behavioral differences that
should be identical across platforms — flag those as bugs.

---

## Running the tests

```sh
# Build the debug APK once
cd apps/simple-camera && bun run build:android

# Install + grant camera / microphone / location permissions
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
BUNDLE_ID=com.margelo.nitro.camera.example.simple
adb shell pm grant $BUNDLE_ID android.permission.CAMERA
adb shell pm grant $BUNDLE_ID android.permission.RECORD_AUDIO
adb shell pm grant $BUNDLE_ID android.permission.ACCESS_FINE_LOCATION
adb shell pm grant $BUNDLE_ID android.permission.ACCESS_COARSE_LOCATION

# Run the full harness suite against the connected device
HARNESS_ANDROID_DEVICE_MANUFACTURER=<manufacturer> \
HARNESS_ANDROID_DEVICE_MODEL=<model> \
bun run test:harness:android

# Or just one file
HARNESS_ANDROID_DEVICE_MANUFACTURER=<manufacturer> \
HARNESS_ANDROID_DEVICE_MODEL=<model> \
bun run test:harness:android -- --testPathPatterns=photo
```

`HARNESS_ANDROID_DEVICE_MANUFACTURER` / `HARNESS_ANDROID_DEVICE_MODEL` come
from `adb shell getprop ro.product.manufacturer` / `ro.product.model`. On AWS
Device Farm they're set automatically by the workflow.

Permissions are granted once per install. If you reinstall the APK with
`adb install -r`, re-run the `pm grant` lines before the next test run —
otherwise the first test's `expect(cameraPermissionStatus).toBe('authorized')`
will fail.

The `.harness/` folder is auto-generated by the harness bundler and is
gitignored. You can safely delete it.

---

## Known API gaps / currently-skipped tests

A few tests are authored but `it.skip`'d because the VisionCamera API
doesn't yet expose the precondition they need. Each skip has a `TODO` in the
file pointing at what needs to land first. Today:

- **Photo container format support** — HEIC and DNG capture work on some
  devices and fail on others, but there is no `CameraDevice.supportedPhotoContainerFormats`
  today. These tests are `it.skip` with a TODO until the API lands. Once it
  exists the tests become soft-requirements gated on the flag.
- **`initialZoom` / `initialExposureBias` on Android** — `applyInitialConfig`
  runs at `configure()` time, before CameraX's LifecycleOwner reaches STARTED.
  `CameraControl.setExposureCompensationIndex` silently fails in that state.
  The corresponding tests are `it.skip` until the initial config application
  happens at a point where CameraX accepts it.
- **`onFrameDropped` on Android** — `HybridFrameOutput.setOnFrameDroppedCallback`
  is a no-op (`TODO: CameraX does not have a way to figure out if a Frame
  has been dropped or not.`).

If you hit another case where you can't write a test because an API is
missing, add the test with `it.skip` and a TODO explaining the precondition
— that way when the API lands we already know which tests to flip back on.

---

## CI

Harness tests run on every push and PR that touches this folder, the
VisionCamera library, or the harness workflow config — see
[.github/workflows/harness-aws-device.yml](../../../.github/workflows/harness-aws-device.yml)
and [.github/workflows/harness-android-emulator.yml](../../../.github/workflows/harness-android-emulator.yml).

The AWS Device Farm run is the source of truth: it's a real phone, a real
SoC, a real camera pipeline. The emulator run is best-effort and may skip
hardware-dependent tests.

If your PR fails CI, the fastest way to debug is:

1. Download the `harness output log` artifact from the failed workflow run.
   It contains the full JS console output per test.
2. Grep for `[SKIP]` to see which soft requirements were skipped — that
   tells you what your test device lacks.
3. Grep for `FAIL` to see which `it` blocks failed and their stack traces.
4. Open the JUnit XML artifact in your IDE's JUnit viewer for a structured
   summary.

---

## High-level components / hooks (`<Camera>`, `useCamera()`, etc.)

Tests for higher-level React components and hooks are **not yet in scope
here**. They'll live alongside the imperative tests when added — same
principles, same folder.

[react-native-harness]: https://github.com/margelo/react-native-harness
