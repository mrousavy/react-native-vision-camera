import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform, StyleSheet } from 'react-native'
import {
  afterEach,
  beforeAll,
  cleanup,
  describe,
  expect,
  it,
  render,
} from 'react-native-harness'
import type {
  CameraDevice,
  CameraRef,
  Constraint,
  Recorder,
} from 'react-native-vision-camera'
import {
  Camera,
  CommonDynamicRanges,
  CommonResolutions,
  VisionCamera,
} from 'react-native-vision-camera'
import { SkiaCamera } from 'react-native-vision-camera-skia'
import { deferred, withTimeout } from './test-utils'

type StartCrashStressMode = 'photo' | 'video'

function getStartCrashStressMode(cycle: number): StartCrashStressMode {
  return cycle % 2 === 1 ? 'video' : 'photo'
}

function isExpectedForcedRecordingStop(error: Error): boolean {
  const message = `${String(error)} ${error.message}`
  return (
    message.includes('AVFoundationErrorDomain Code=-11818') &&
    message.includes('AVErrorRecordingSuccessfullyFinishedKey=true')
  )
}

describe('VisionCamera - Start Crash Stress', () => {
  let backDevice: CameraDevice
  let frontDevice: CameraDevice | undefined

  beforeAll(async () => {
    await VisionCamera.requestCameraPermission()
    await VisionCamera.requestMicrophonePermission()
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    expect(VisionCamera.microphonePermissionStatus).toBe('authorized')
    const factory = await VisionCamera.createDeviceFactory()
    const back = factory.getDefaultCamera('back')
    expect(back).toBeDefined()
    if (back == null) throw new Error('no back camera')
    backDevice = back
    frontDevice = factory.getDefaultCamera('front')
  })

  afterEach(() => {
    cleanup()
  })

  async function runOutputTopologyStress(
    renderWithSkiaPreview: boolean,
    maxCycles: number,
  ) {
    const finished = deferred<number>()
    let sessionError: Error | undefined

    function RestartingCamera() {
      const [isActive, setIsActive] = useState(true)
      const [cycle, setCycle] = useState(0)
      const [variant, setVariant] = useState(0)
      const [enablePhotoHDR, setEnablePhotoHDR] = useState(false)
      const mode = getStartCrashStressMode(cycle)

      const photoOutput = useMemo(
        () =>
          VisionCamera.createPhotoOutput({
            targetResolution: CommonResolutions.HD_4_3,
            containerFormat: 'jpeg',
            quality: 0.8,
            qualityPrioritization: 'balanced',
          }),
        [],
      )
      const videoOutput = useMemo(
        () =>
          VisionCamera.createVideoOutput({
            targetResolution:
              variant % 2 === 0
                ? CommonResolutions.FHD_16_9
                : CommonResolutions.HD_16_9,
            targetBitRate: variant % 2 === 0 ? 20_000_000 : 12_000_000,
            enableAudio: false,
          }),
        [variant],
      )
      const outputs = useMemo(
        () => (mode === 'video' ? [videoOutput] : [photoOutput]),
        [mode, photoOutput, videoOutput],
      )
      const constraints = useMemo<Constraint[]>(() => {
        const nextConstraints: Constraint[] = []
        if (backDevice.supportsFPS(60)) {
          nextConstraints.push({ fps: 60 })
        }
        if (
          mode === 'video' &&
          backDevice.supportsVideoStabilizationMode('cinematic-extended')
        ) {
          nextConstraints.push({ videoStabilizationMode: 'cinematic-extended' })
        }
        if (mode === 'photo' && enablePhotoHDR && backDevice.supportsPhotoHDR) {
          nextConstraints.unshift({ photoHDR: true })
        }
        return nextConstraints
      }, [enablePhotoHDR, mode])
      const onStarted = useCallback(() => {
        setIsActive(false)
      }, [])
      const onStopped = useCallback(() => {
        const nextCycle = cycle + 1
        if (nextCycle >= maxCycles) {
          console.log(
            `start crash stress completed ${nextCycle} ${renderWithSkiaPreview ? 'Skia' : 'Camera'} cycles on ${backDevice.localizedName}`,
          )
          finished.resolve(nextCycle)
          return
        }

        setCycle(nextCycle)
        setVariant((current) => current + 1)
        setEnablePhotoHDR((current) => !current)
        setIsActive(true)
      }, [cycle])
      const onError = useCallback((error: Error) => {
        sessionError = error
        finished.reject(error)
      }, [])

      if (renderWithSkiaPreview) {
        return (
          <SkiaCamera
            device={backDevice}
            isActive={isActive}
            outputs={outputs}
            constraints={constraints}
            style={StyleSheet.absoluteFill}
            enablePreviewSizedOutputBuffers={true}
            onFrame={(frame, render) => {
              'worklet'
              render(({ canvas, frameTexture }) => {
                canvas.drawImage(frameTexture, 0, 0)
              })
              frame.dispose()
            }}
            onStarted={onStarted}
            onStopped={onStopped}
            onError={onError}
          />
        )
      }

      return (
        <Camera
          device={backDevice}
          isActive={isActive}
          outputs={outputs}
          constraints={constraints}
          style={StyleSheet.absoluteFill}
          onStarted={onStarted}
          onStopped={onStopped}
          onError={onError}
        />
      )
    }

    await render(<RestartingCamera />)
    const cycles = await withTimeout(
      finished.promise,
      90_000,
      `${renderWithSkiaPreview ? 'Skia' : 'Camera'} photo/video/photo output topology stress`,
    )

    expect(cycles).toBe(maxCycles)
    expect(sessionError).toBe(undefined)
  }

  async function runActiveCaptureTopologyStress(maxCycles: number) {
    const finished = deferred<number>()
    let sessionError: Error | undefined

    function CapturingCamera() {
      const [isActive, setIsActive] = useState(true)
      const [cycle, setCycle] = useState(0)
      const [variant, setVariant] = useState(0)
      const captureInFlight = useRef(false)
      const mode = getStartCrashStressMode(cycle)

      const photoOutput = useMemo(
        () =>
          VisionCamera.createPhotoOutput({
            targetResolution: CommonResolutions.HD_4_3,
            containerFormat: 'jpeg',
            quality: 0.8,
            qualityPrioritization: 'balanced',
          }),
        [],
      )
      const videoOutput = useMemo(
        () =>
          VisionCamera.createVideoOutput({
            targetResolution:
              variant % 2 === 0
                ? CommonResolutions.FHD_16_9
                : CommonResolutions.HD_16_9,
            targetBitRate: variant % 2 === 0 ? 20_000_000 : 12_000_000,
            enableAudio: false,
          }),
        [variant],
      )
      const outputs = useMemo(
        () => (mode === 'video' ? [videoOutput] : [photoOutput]),
        [mode, photoOutput, videoOutput],
      )
      const constraints = useMemo<Constraint[]>(() => {
        const nextConstraints: Constraint[] = []
        if (backDevice.supportsFPS(60)) {
          nextConstraints.push({ fps: 60 })
        }
        if (
          mode === 'video' &&
          backDevice.supportsVideoStabilizationMode('cinematic-extended')
        ) {
          nextConstraints.push({ videoStabilizationMode: 'cinematic-extended' })
        }
        return nextConstraints
      }, [mode])
      const onStarted = useCallback(() => {
        if (captureInFlight.current) return
        captureInFlight.current = true

        const runCapture = async () => {
          try {
            if (mode === 'photo') {
              const photo = await photoOutput.capturePhoto(
                { flashMode: 'off', enableShutterSound: false },
                {},
              )
              photo.dispose()
            } else {
              const recorder = await videoOutput.createRecorder({})
              await recorder.startRecording(
                () => {},
                (error) => {
                  sessionError = error
                  finished.reject(error)
                },
              )
              await recorder.stopRecording()
            }
          } catch (error) {
            sessionError = error as Error
            finished.reject(sessionError)
          } finally {
            captureInFlight.current = false
            setIsActive(false)
          }
        }

        void runCapture()
      }, [mode, photoOutput, videoOutput])
      const onStopped = useCallback(() => {
        const nextCycle = cycle + 1
        if (nextCycle >= maxCycles) {
          console.log(
            `start crash active capture stress completed ${nextCycle} Skia cycles on ${backDevice.localizedName}`,
          )
          finished.resolve(nextCycle)
          return
        }

        setCycle(nextCycle)
        setVariant((current) => current + 1)
        setIsActive(true)
      }, [cycle])
      const onError = useCallback((error: Error) => {
        sessionError = error
        finished.reject(error)
      }, [])

      return (
        <SkiaCamera
          device={backDevice}
          isActive={isActive}
          outputs={outputs}
          constraints={constraints}
          style={StyleSheet.absoluteFill}
          enablePreviewSizedOutputBuffers={true}
          onFrame={(frame, render) => {
            'worklet'
            render(({ canvas, frameTexture }) => {
              canvas.drawImage(frameTexture, 0, 0)
            })
            frame.dispose()
          }}
          onStarted={onStarted}
          onStopped={onStopped}
          onError={onError}
        />
      )
    }

    await render(<CapturingCamera />)
    const cycles = await withTimeout(
      finished.promise,
      90_000,
      'Skia photo capture/video recording/photo capture topology stress',
    )

    expect(cycles).toBe(maxCycles)
    expect(sessionError).toBe(undefined)
  }

  async function runProductionShapeRestartStress(maxCycles: number) {
    const finished = deferred<number>()
    let sessionError: Error | undefined

    function ProductionShapeCamera() {
      const cameraRef = useRef<CameraRef>(null)
      const [isActive, setIsActive] = useState(true)
      const [cycle, setCycle] = useState(0)
      const [isMuted, setIsMuted] = useState(false)
      const [enablePhotoHDR, setEnablePhotoHDR] = useState(false)

      const photoOutput = useMemo(
        () =>
          VisionCamera.createPhotoOutput({
            targetResolution: CommonResolutions.HD_4_3,
            containerFormat: 'jpeg',
            quality: 0.8,
            qualityPrioritization: 'balanced',
          }),
        [],
      )
      const videoOutput = useMemo(
        () =>
          VisionCamera.createVideoOutput({
            targetResolution: CommonResolutions.FHD_16_9,
            targetBitRate: 20_000_000,
            enableAudio: !isMuted,
          }),
        [isMuted],
      )
      const outputs = useMemo(
        () => [photoOutput, videoOutput],
        [photoOutput, videoOutput],
      )
      const constraints = useMemo<Constraint[]>(() => {
        const nextConstraints: Constraint[] = []
        if (enablePhotoHDR && backDevice.supportsPhotoHDR) {
          nextConstraints.push({ photoHDR: true })
        }
        if (backDevice.supportsFPS(60)) {
          nextConstraints.push({ fps: 60 })
        }
        if (backDevice.supportsVideoStabilizationMode('cinematic-extended')) {
          nextConstraints.push({ videoStabilizationMode: 'cinematic-extended' })
        }
        if (
          enablePhotoHDR &&
          backDevice.supportedVideoDynamicRanges.some(
            (dynamicRange) => dynamicRange.bitDepth === 'hdr-10-bit',
          )
        ) {
          nextConstraints.push({
            videoDynamicRange: CommonDynamicRanges.ANY_HDR,
          })
        }
        return nextConstraints
      }, [enablePhotoHDR])
      const zoomTargets = useMemo(() => {
        const neutralZoom =
          backDevice.zoomLensSwitchFactors[0] ?? Math.max(backDevice.minZoom, 1)
        const candidates = [
          backDevice.minZoom,
          neutralZoom,
          neutralZoom * 2,
          neutralZoom * 3,
        ]
        return candidates.filter(
          (zoom, index) =>
            zoom >= backDevice.minZoom &&
            zoom <= backDevice.maxZoom &&
            candidates.indexOf(zoom) === index,
        )
      }, [])
      const onStarted = useCallback(() => {
        const applyZoomAndStop = async () => {
          try {
            const targetZoom = zoomTargets[cycle % zoomTargets.length] ?? 1
            await cameraRef.current?.controller?.setZoom(targetZoom)
          } catch (error) {
            console.log(`start crash stress zoom update failed: ${error}`)
          } finally {
            setIsActive(false)
          }
        }

        void applyZoomAndStop()
      }, [cycle, zoomTargets])
      const onStopped = useCallback(() => {
        const nextCycle = cycle + 1
        if (nextCycle >= maxCycles) {
          console.log(
            `start crash production-shape stress completed ${nextCycle} Camera cycles on ${backDevice.localizedName}`,
          )
          finished.resolve(nextCycle)
          return
        }

        setCycle(nextCycle)
        setIsMuted((current) => !current)
        setEnablePhotoHDR((current) => !current)
        setIsActive(true)
      }, [cycle])
      const onError = useCallback((error: Error) => {
        sessionError = error
        finished.reject(error)
      }, [])

      return (
        <Camera
          ref={cameraRef}
          device={backDevice}
          isActive={isActive}
          outputs={outputs}
          constraints={constraints}
          style={StyleSheet.absoluteFill}
          onStarted={onStarted}
          onStopped={onStopped}
          onError={onError}
        />
      )
    }

    await render(<ProductionShapeCamera />)
    const cycles = await withTimeout(
      finished.promise,
      90_000,
      'Camera production-shape restart stress',
    )

    expect(cycles).toBe(maxCycles)
    expect(sessionError).toBe(undefined)
  }

  async function runReporterStyleActiveInteractionStress(maxCycles: number) {
    const finished = deferred<number>()
    let sessionError: Error | undefined

    function ActiveInteractionCamera() {
      const cameraRef = useRef<CameraRef>(null)
      const [, setCycle] = useState(0)
      const [configuredTick, setConfiguredTick] = useState(0)
      const [isMuted, setIsMuted] = useState(false)
      const [enablePhotoHDR, setEnablePhotoHDR] = useState(false)
      const [useFrontDevice, setUseFrontDevice] = useState(false)
      const hasStarted = useRef(false)
      const isRunningCycle = useRef(false)
      const continueAfterConfigured = useRef(false)
      const cycleRef = useRef(0)
      const currentDevice =
        useFrontDevice && frontDevice != null ? frontDevice : backDevice

      const photoOutput = useMemo(
        () =>
          VisionCamera.createPhotoOutput({
            targetResolution: CommonResolutions.HD_4_3,
            containerFormat: 'jpeg',
            quality: 0.8,
            qualityPrioritization: 'balanced',
          }),
        [],
      )
      const videoOutput = useMemo(
        () =>
          VisionCamera.createVideoOutput({
            targetResolution: CommonResolutions.FHD_16_9,
            targetBitRate: 20_000_000,
            enableAudio: !isMuted,
          }),
        [isMuted],
      )
      const outputs = useMemo(
        () => [photoOutput, videoOutput],
        [photoOutput, videoOutput],
      )
      const constraints = useMemo<Constraint[]>(() => {
        const nextConstraints: Constraint[] = []
        if (enablePhotoHDR && currentDevice.supportsPhotoHDR) {
          nextConstraints.push({ photoHDR: true })
        }
        if (currentDevice.supportsFPS(60)) {
          nextConstraints.push({ fps: 60 })
        }
        if (
          currentDevice.supportsVideoStabilizationMode('cinematic-extended')
        ) {
          nextConstraints.push({ videoStabilizationMode: 'cinematic-extended' })
        }
        if (
          enablePhotoHDR &&
          currentDevice.supportedVideoDynamicRanges.some(
            (dynamicRange) => dynamicRange.bitDepth === 'hdr-10-bit',
          )
        ) {
          nextConstraints.push({
            videoDynamicRange: CommonDynamicRanges.ANY_HDR,
          })
        }
        return nextConstraints
      }, [currentDevice, enablePhotoHDR])
      const zoomTargets = useMemo(() => {
        const neutralZoom =
          currentDevice.zoomLensSwitchFactors[0] ??
          Math.max(currentDevice.minZoom, 1)
        const candidates = [
          currentDevice.minZoom,
          neutralZoom,
          neutralZoom * 2,
          neutralZoom * 3,
        ]
        return candidates.filter(
          (zoom, index) =>
            zoom >= currentDevice.minZoom &&
            zoom <= currentDevice.maxZoom &&
            candidates.indexOf(zoom) === index,
        )
      }, [currentDevice])
      const rejectWithError = useCallback((error: Error) => {
        sessionError = error
        finished.reject(error)
      }, [])
      const logExpectedControlError = useCallback(
        (label: string, error: Error) => {
          console.log(
            `start crash active interaction ${label} failed: ${error}`,
          )
        },
        [],
      )
      const runNextCycle = useCallback(() => {
        if (isRunningCycle.current) return
        isRunningCycle.current = true

        try {
          const nextCycle = cycleRef.current
          if (nextCycle >= maxCycles) {
            void cameraRef.current?.controller
              ?.setTorchMode('off')
              .catch(() => {})
            console.log(
              `start crash active interaction stress completed ${nextCycle} Camera cycles on ${backDevice.localizedName}`,
            )
            finished.resolve(nextCycle)
            return
          }

          const controller = cameraRef.current?.controller
          if (controller != null) {
            const targetZoom = zoomTargets[nextCycle % zoomTargets.length] ?? 1
            void controller
              .setZoom(targetZoom)
              .catch((error) => logExpectedControlError('zoom update', error))

            if (currentDevice.supportsExposureBias) {
              const exposureTargets = [
                currentDevice.minExposureBias,
                currentDevice.maxExposureBias,
                0,
              ]
              const targetExposure =
                exposureTargets[nextCycle % exposureTargets.length] ?? 0
              void controller
                .setExposureBias(targetExposure)
                .catch((error) =>
                  logExpectedControlError('exposure update', error),
                )
            }

            if (currentDevice.hasTorch) {
              void controller
                .setTorchMode(nextCycle % 2 === 0 ? 'on' : 'off')
                .catch((error) =>
                  logExpectedControlError('torch update', error),
                )
            }

            if (currentDevice.supportsFocusMetering) {
              const focusPoints = [
                { x: 120, y: 160 },
                { x: 240, y: 240 },
                { x: 160, y: 360 },
              ]
              const focusPoint =
                focusPoints[nextCycle % focusPoints.length] ?? focusPoints[0]
              if (focusPoint != null) {
                void cameraRef.current
                  ?.focusTo(focusPoint, {
                    adaptiveness: 'continuous',
                    autoResetAfter: null,
                    responsiveness: 'snappy',
                  })
                  .catch((error) =>
                    logExpectedControlError('focus update', error),
                  )
              }
            }
          }

          cycleRef.current = nextCycle + 1
          continueAfterConfigured.current = true
          setCycle(cycleRef.current)
          setIsMuted((current) => !current)
          setEnablePhotoHDR((current) => !current)
          if (frontDevice != null && nextCycle % 8 === 7) {
            setUseFrontDevice((current) => !current)
          }
        } catch (error) {
          rejectWithError(error as Error)
        } finally {
          isRunningCycle.current = false
        }
      }, [currentDevice, logExpectedControlError, rejectWithError, zoomTargets])
      const onStarted = useCallback(() => {
        if (hasStarted.current) return
        hasStarted.current = true
        runNextCycle()
      }, [runNextCycle])
      const onConfigured = useCallback(() => {
        if (!hasStarted.current || !continueAfterConfigured.current) return

        continueAfterConfigured.current = false
        setConfiguredTick((current) => current + 1)
      }, [])

      useEffect(() => {
        if (configuredTick === 0) return
        runNextCycle()
      }, [configuredTick, runNextCycle])

      return (
        <Camera
          ref={cameraRef}
          device={currentDevice}
          isActive={true}
          outputs={outputs}
          constraints={constraints}
          style={StyleSheet.absoluteFill}
          mirrorMode={useFrontDevice ? 'on' : 'off'}
          onStarted={onStarted}
          onConfigured={onConfigured}
          onError={rejectWithError}
        />
      )
    }

    await render(<ActiveInteractionCamera />)
    const cycles = await withTimeout(
      finished.promise,
      90_000,
      'Camera reporter-style active interaction stress',
    )

    expect(cycles).toBe(maxCycles)
    expect(sessionError).toBe(undefined)
  }

  async function runRecordingOutputMutationStress(maxCycles: number) {
    const finished = deferred<{
      cycles: number
      forcedRecordingStops: number
    }>()
    let sessionError: Error | undefined

    function RecordingMutationCamera() {
      const [isActive, setIsActive] = useState(true)
      const [cycle, setCycle] = useState(0)
      const [isMuted, setIsMuted] = useState(false)
      const [enableVideoHDR, setEnableVideoHDR] = useState(false)
      const recorderRef = useRef<Recorder | null>(null)
      const recordingInFlight = useRef(false)
      const shouldStopAfterReconfigure = useRef(false)
      const forcedRecordingStops = useRef(0)

      const photoOutput = useMemo(
        () =>
          VisionCamera.createPhotoOutput({
            targetResolution: CommonResolutions.HD_4_3,
            containerFormat: 'jpeg',
            quality: 0.8,
            qualityPrioritization: 'balanced',
          }),
        [],
      )
      const videoOutput = useMemo(
        () =>
          VisionCamera.createVideoOutput({
            targetResolution: CommonResolutions.FHD_16_9,
            targetBitRate: 20_000_000,
            enableAudio: !isMuted,
          }),
        [isMuted],
      )
      const outputs = useMemo(
        () => [photoOutput, videoOutput],
        [photoOutput, videoOutput],
      )
      const constraints = useMemo<Constraint[]>(() => {
        const nextConstraints: Constraint[] = []
        if (backDevice.supportsFPS(60)) {
          nextConstraints.push({ fps: 60 })
        }
        if (backDevice.supportsVideoStabilizationMode('cinematic-extended')) {
          nextConstraints.push({ videoStabilizationMode: 'cinematic-extended' })
        }
        if (
          enableVideoHDR &&
          backDevice.supportedVideoDynamicRanges.some(
            (dynamicRange) => dynamicRange.bitDepth === 'hdr-10-bit',
          )
        ) {
          nextConstraints.push({
            videoDynamicRange: CommonDynamicRanges.ANY_HDR,
          })
        }
        return nextConstraints
      }, [enableVideoHDR])
      const rejectWithError = useCallback((error: Error) => {
        sessionError = error
        finished.reject(error)
      }, [])
      const handleRecordingError = useCallback(
        (error: Error) => {
          if (!isExpectedForcedRecordingStop(error)) {
            rejectWithError(error)
            return
          }

          forcedRecordingStops.current += 1
          recorderRef.current = null
          recordingInFlight.current = false
          shouldStopAfterReconfigure.current = false
          setIsActive(false)
        },
        [rejectWithError],
      )
      const stopRecorderAndDeactivate = useCallback(async () => {
        const recorder = recorderRef.current
        if (recorder == null) return

        try {
          await recorder.stopRecording()
        } catch (error) {
          handleRecordingError(error as Error)
        } finally {
          recorderRef.current = null
          recordingInFlight.current = false
          shouldStopAfterReconfigure.current = false
          setIsActive(false)
        }
      }, [handleRecordingError])
      const onSessionConfigSelected = useCallback(() => {
        if (!shouldStopAfterReconfigure.current) return

        shouldStopAfterReconfigure.current = false
        void stopRecorderAndDeactivate()
      }, [stopRecorderAndDeactivate])
      const onStarted = useCallback(() => {
        if (recordingInFlight.current) return
        recordingInFlight.current = true

        const mutateOutputWhileRecording = async () => {
          try {
            const recorder = await videoOutput.createRecorder({})
            recorderRef.current = recorder
            await recorder.startRecording(
              () => {},
              (error) => {
                handleRecordingError(error)
              },
            )
            shouldStopAfterReconfigure.current = true
            setIsMuted((current) => !current)
            setEnableVideoHDR((current) => !current)
          } catch (error) {
            recordingInFlight.current = false
            rejectWithError(error as Error)
          }
        }

        void mutateOutputWhileRecording()
      }, [handleRecordingError, rejectWithError, videoOutput])
      const onStopped = useCallback(() => {
        const nextCycle = cycle + 1
        if (nextCycle >= maxCycles) {
          console.log(
            `start crash recording mutation stress completed ${nextCycle} Skia cycles on ${backDevice.localizedName} with ${forcedRecordingStops.current} forced stops`,
          )
          finished.resolve({
            cycles: nextCycle,
            forcedRecordingStops: forcedRecordingStops.current,
          })
          return
        }

        setCycle(nextCycle)
        setIsActive(true)
      }, [cycle])

      return (
        <SkiaCamera
          device={backDevice}
          isActive={isActive}
          outputs={outputs}
          constraints={constraints}
          style={StyleSheet.absoluteFill}
          enablePreviewSizedOutputBuffers={true}
          onFrame={(frame, render) => {
            'worklet'
            render(({ canvas, frameTexture }) => {
              canvas.drawImage(frameTexture, 0, 0)
            })
            frame.dispose()
          }}
          onStarted={onStarted}
          onStopped={onStopped}
          onSessionConfigSelected={onSessionConfigSelected}
          onError={rejectWithError}
        />
      )
    }

    await render(<RecordingMutationCamera />)
    const result = await withTimeout(
      finished.promise,
      90_000,
      'Skia recording output mutation stress',
    )

    expect(result.cycles).toBe(maxCycles)
    expect(result.forcedRecordingStops).toBeGreaterThan(0)
    expect(sessionError).toBe(undefined)
  }

  it('cycles photo -> video -> photo outputs through native preview start/stop', async (context) => {
    if (Platform.OS !== 'ios') {
      return context.skip(
        'AVFoundation attach/detach assertion stress: iOS only',
      )
    }

    await runOutputTopologyStress(false, 60)
  })

  it('cycles photo -> video -> photo outputs with Skia frame-preview attached', async (context) => {
    if (Platform.OS !== 'ios') {
      return context.skip(
        'AVFoundation attach/detach assertion stress: iOS only',
      )
    }

    await runOutputTopologyStress(true, 60)
  })

  it('captures photo -> records video -> captures photo with Skia frame-preview attached', async (context) => {
    if (Platform.OS !== 'ios') {
      return context.skip(
        'AVFoundation attach/detach assertion stress: iOS only',
      )
    }

    await runActiveCaptureTopologyStress(18)
  })

  it('restarts with stable photo/video outputs while toggling audio, HDR, and zoom', async (context) => {
    if (Platform.OS !== 'ios') {
      return context.skip(
        'AVFoundation attach/detach assertion stress: iOS only',
      )
    }

    await runProductionShapeRestartStress(80)
  })

  it('recreates video output while recording with Skia frame-preview attached', async (context) => {
    if (Platform.OS !== 'ios') {
      return context.skip(
        'AVFoundation attach/detach assertion stress: iOS only',
      )
    }

    await runRecordingOutputMutationStress(12)
  })

  it('mutates reporter-style active controls while reconfiguring outputs', async (context) => {
    if (Platform.OS !== 'ios') {
      return context.skip(
        'AVFoundation attach/detach assertion stress: iOS only',
      )
    }

    await runReporterStyleActiveInteractionStress(80)
  })
})
