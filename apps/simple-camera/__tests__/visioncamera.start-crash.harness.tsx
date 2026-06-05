import { useCallback, useMemo, useRef, useState } from 'react'
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
import type { CameraDevice, Constraint } from 'react-native-vision-camera'
import {
  Camera,
  CommonResolutions,
  VisionCamera,
} from 'react-native-vision-camera'
import { SkiaCamera } from 'react-native-vision-camera-skia'
import { deferred, withTimeout } from './test-utils'

type StartCrashStressMode = 'photo' | 'video'

function getStartCrashStressMode(cycle: number): StartCrashStressMode {
  return cycle % 2 === 1 ? 'video' : 'photo'
}

describe('VisionCamera - Start Crash Stress', () => {
  let backDevice: CameraDevice

  beforeAll(async () => {
    await VisionCamera.requestCameraPermission()
    expect(VisionCamera.cameraPermissionStatus).toBe('authorized')
    const factory = await VisionCamera.createDeviceFactory()
    const back = factory.getDefaultCamera('back')
    expect(back).toBeDefined()
    if (back == null) throw new Error('no back camera')
    backDevice = back
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
})
