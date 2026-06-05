import { useIsFocused, useNavigation } from '@react-navigation/native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StatusBar, StyleSheet, Text, View } from 'react-native'
import {
  CommonResolutions,
  type Constraint,
  type Recorder,
  useCameraDeviceExtensions,
  useCameraDevices,
  useDepthOutput,
  useFrameOutput,
  usePhotoOutput,
  useVideoOutput,
} from 'react-native-vision-camera'
import { useLocation } from 'react-native-vision-camera-location'
import { useResizer } from 'react-native-vision-camera-resizer'
import { SkiaCamera } from 'react-native-vision-camera-skia'
import { CameraSelectorButton } from '../components/CameraSelectorButton'
import { CameraView } from '../components/CameraView'
import { CaptureButton } from '../components/CaptureButton'
import { FullOverlay } from '../components/FullOverlay'
import { Row } from '../components/Row'
import { useIsActive } from '../hooks/useIsActive'
import { useSafeAreaPadding } from '../hooks/useSafeAreaPadding'
import { logDevices } from '../logDevices'

const START_CRASH_REPRO = true

function getStartCrashMode(cycle: number): 'photo' | 'video' {
  return cycle % 2 === 1 ? 'video' : 'photo'
}

export function CameraScreen() {
  const navigation = useNavigation()
  const isAppActive = useIsActive()
  const isScreenFocused = useIsFocused()
  const safePadding = useSafeAreaPadding()
  const [enablePhoto, setEnablePhoto] = useState(true)
  const [enableVideo, setEnableVideo] = useState(false)
  const [enableFrameStream, setEnableFrameStream] = useState(false)
  const [enableDepthStream, setEnableDepthStream] = useState(false)

  const devices = useCameraDevices()
  const defaultDevice = useMemo(
    () =>
      devices.find(
        (d) => d.position === 'back' && d.physicalDevices.length > 1,
      ) ??
      devices.find((d) => d.position === 'back') ??
      devices[0],
    [devices],
  )
  const [device, setDevice] = useState(defaultDevice)
  const [startCrashReproActive, setStartCrashReproActive] = useState(true)
  const [startCrashReproCycle, setStartCrashReproCycle] = useState(0)
  const [startCrashReproVariant, setStartCrashReproVariant] = useState(0)
  const [startCrashReproHDR, setStartCrashReproHDR] = useState(false)

  useEffect(() => {
    setDevice(defaultDevice)
  }, [defaultDevice])

  useEffect(() => logDevices(devices), [devices])

  const location = useLocation({
    accuracy: 'balanced',
    distanceFilter: 10,
  })
  useEffect(() => {
    if (!location.hasPermission) {
      ;(async () => {
        console.log(`requesting location permission...`)
        const has = await location.requestPermission()
        console.log(`location permssion: ${has}`)
      })()
    }
  }, [location.hasPermission, location.requestPermission])
  useEffect(() => {
    const l = location.currentLocation
    if (l == null) return
    console.log(`Location: ${l.latitude} ${l.longitude}`)
  }, [location.currentLocation])

  const photoOutput = usePhotoOutput({})
  const videoOutput = useVideoOutput({
    targetResolution:
      startCrashReproVariant % 2 === 0
        ? CommonResolutions.FHD_16_9
        : CommonResolutions.HD_16_9,
    targetBitRate: startCrashReproVariant % 2 === 0 ? 20_000_000 : 12_000_000,
    enableAudio: false,
  })
  const startCrashReproMode = getStartCrashMode(startCrashReproCycle)
  const cameraOutputs = useMemo(
    () =>
      START_CRASH_REPRO && startCrashReproMode === 'video'
        ? [videoOutput]
        : [photoOutput],
    [photoOutput, startCrashReproMode, videoOutput],
  )
  const cameraConstraints = useMemo<Constraint[]>(() => {
    if (!START_CRASH_REPRO) return []
    const nextConstraints: Constraint[] = []
    if (device?.supportsFPS(60)) {
      nextConstraints.push({ fps: 60 })
    }
    if (
      startCrashReproMode === 'video' &&
      device?.supportsVideoStabilizationMode('cinematic-extended')
    ) {
      nextConstraints.push({ videoStabilizationMode: 'cinematic-extended' })
    }
    if (
      startCrashReproMode === 'photo' &&
      startCrashReproHDR &&
      device?.supportsPhotoHDR
    ) {
      nextConstraints.unshift({ photoHDR: true })
    }
    return nextConstraints
  }, [device, startCrashReproHDR, startCrashReproMode])
  const { resizer, error } = useResizer({
    width: 192,
    height: 192,
    channelOrder: 'rgb',
    dataType: 'float32',
    scaleMode: 'cover',
    pixelLayout: 'interleaved',
  })
  useEffect(() => {
    if (error != null) console.error('Failed to prepare Resizer!', error)
  }, [error])
  const frameOutput1 = useFrameOutput({
    pixelFormat: 'yuv',
    onFrame(frame) {
      'worklet'
      if (resizer != null) {
        const start = performance.now()
        const resized = resizer.resize(frame)
        const end = performance.now()
        const time = `${(end - start).toFixed(2)}ms`
        console.log(
          `Resized ${frame.width}x${frame.height} ${frame.pixelFormat} -> ${resized.width}x${resized.height} rgb-float32 in ${time}`,
        )
        const buffer = resized.getPixelBuffer()
        const view = new Float32Array(buffer)
        for (let i = 0; i < 3 * 10; i += 3) {
          console.log(
            `  Pixel [${i}] = [${view[i]}, ${view[i + 1]}, ${view[i + 2]}]`,
          )
        }
        resized.dispose()
      } else {
        console.log(`Resizer isn't ready yet...`)
      }
      frame.dispose()
    },
  })
  const frameOutput2 = useFrameOutput({
    pixelFormat: 'native',
    onFrame(frame) {
      'worklet'
      console.log(
        `frame output #2: ${frame.width}x${frame.height} in ${frame.pixelFormat}`,
      )
      try {
        const data = frame.getPixelBuffer()
        console.log(`Pixels: ${data.byteLength}`)
      } catch {}
      frame.dispose()
    },
  })
  const depthOutput = useDepthOutput({
    onDepth(depth) {
      'worklet'
      console.log(`${depth.width}x${depth.height} depth frame.`)
      const calibrationData = depth.cameraCalibrationData
      if (calibrationData != null) {
        console.log(
          `.cameraExtrinsicsMatrix: ${calibrationData.cameraExtrinsicsMatrix.join(', ')}`,
        )
        console.log(
          `.cameraIntrinsicMatrix: ${calibrationData.cameraIntrinsicMatrix.join(', ')}`,
        )
        console.log(
          `.intrinsicMatrixReferenceDimensions: ${calibrationData.intrinsicMatrixReferenceDimensions.width}x${calibrationData.intrinsicMatrixReferenceDimensions.height}`,
        )
        console.log(`.pixelSize: ${calibrationData.pixelSize}`)
        console.log(
          `.lensDistortionCenter: ${calibrationData.lensDistortionCenter}`,
        )
      } else {
        console.log(`no calibration data!`)
      }
      depth.dispose()
    },
  })

  const extensions = useCameraDeviceExtensions(device)
  useEffect(() => {
    if (extensions == null) return
    console.log(
      'Available Camera Extensions:',
      extensions.map((e) => e.type),
    )
  }, [extensions])

  const takePhoto = useCallback(async () => {
    try {
      console.log(`Capturing Photo...`)
      const start = performance.now()
      const photo = await photoOutput.capturePhoto(
        {
          location: location.currentLocation,
        },
        {},
      )
      const end = performance.now()
      const duration = (end - start).toFixed(2)
      console.log(
        `Captured ${photo.width}x${photo.height} ${photo.containerFormat} Photo in ${duration}ms!`,
      )
      navigation.navigate('Photo', { photo: photo })
    } catch (e) {
      console.error(`Failed to take Photo!`, e)
    }
  }, [navigation, photoOutput, location.currentLocation])

  const preparedRecorder = useRef<Recorder>(undefined)
  const activeRecorder = useRef<Recorder>(undefined)
  const startRecording = useCallback(async () => {
    console.log(`Starting Recording...`)
    // get previously prepared recorder (cached)
    let recorder = preparedRecorder.current
    if (recorder == null) {
      console.log(`No prepared Recorder available, creating one...`)
      recorder = await videoOutput.createRecorder({})
    }
    if (activeRecorder.current != null) {
      // currently recording - abort
      console.error(`Cannot start recording - already actively recording!`)
      return
    }
    // setting it as actively recording
    activeRecorder.current = recorder
    // start recording
    await recorder.startRecording(
      (path) => {
        console.log(`Recording finished! Path:`, path)
        navigation.navigate('Video', { videoURL: path })
        activeRecorder.current = undefined
      },
      (error) => {
        console.error(`Failed to record!`, error)
        activeRecorder.current = undefined
      },
      () => console.log(`Recording paused`),
      () => console.log(`Recording resumed.`),
    )
    console.log(`Recording started!`)
    // prepare a new recorder for the next call
    preparedRecorder.current = await videoOutput.createRecorder({})
  }, [navigation.navigate, videoOutput.createRecorder])
  const stopRecording = useCallback(async () => {
    console.log(`Stopping Recording...`)
    const recorder = activeRecorder.current
    if (recorder == null) {
      console.error(`Not actively recording - cannot stop recording!`)
      return
    }
    activeRecorder.current = undefined
    await recorder.stopRecording()
    console.log(`Recording stopped!`)
  }, [])
  const onCameraStarted = useCallback(() => {
    if (!START_CRASH_REPRO) return
    console.log(
      `[START_CRASH_REPRO] ${startCrashReproMode} cycle ${startCrashReproCycle} started; stopping before next reconfigure/start`,
    )
    setStartCrashReproActive(false)
  }, [startCrashReproCycle, startCrashReproMode])
  const onCameraStopped = useCallback(() => {
    if (!START_CRASH_REPRO) return
    setStartCrashReproCycle((cycle) => {
      const nextCycle = cycle + 1
      const nextMode = getStartCrashMode(nextCycle)
      console.log(
        `[START_CRASH_REPRO] cycle ${cycle} stopped; switching to ${nextMode} outputs and immediately restarting cycle ${nextCycle}`,
      )
      return nextCycle
    })
    setStartCrashReproVariant((variant) => variant + 1)
    setStartCrashReproHDR((hdr) => !hdr)
    setStartCrashReproActive(true)
  }, [])

  if (device == null) {
    return (
      <View style={styles.textContainer}>
        <Text style={styles.text}>No Camera Device!</Text>
      </View>
    )
  }
  return (
    <View style={[styles.container, safePadding]}>
      <StatusBar barStyle="light-content" />

      {START_CRASH_REPRO ? (
        <SkiaCamera
          isActive={isAppActive && isScreenFocused && startCrashReproActive}
          style={styles.camera}
          device={device}
          outputs={cameraOutputs}
          mirrorMode={device.position === 'front' ? 'on' : 'off'}
          constraints={cameraConstraints}
          enablePreviewSizedOutputBuffers={true}
          onFrame={(frame, render) => {
            'worklet'
            render(({ canvas, frameTexture }) => {
              canvas.drawImage(frameTexture, 0, 0)
            })
            frame.dispose()
          }}
          onStarted={onCameraStarted}
          onStopped={onCameraStopped}
          onSessionConfigSelected={(config) => {
            console.log(`Given Constraints:`, cameraConstraints)
            console.log(`Resolved SessionConfig:`, config.toString())
          }}
          onInterruptionStarted={(reason) =>
            console.log(`Camera interrupted! Reason: ${reason}`)
          }
          onInterruptionEnded={() => console.log(`Camera interruption over.`)}
          onError={(error) => console.error(`Camera error:`, error)}
        />
      ) : (
        <CameraView
          isActive={isAppActive && isScreenFocused}
          device={device}
          outputs={cameraOutputs}
          mirrorMode={device.position === 'front' ? 'on' : 'off'}
          constraints={cameraConstraints}
          onInterruptionStarted={(reason) =>
            console.log(`Camera interrupted! Reason: ${reason}`)
          }
          onInterruptionEnded={() => console.log(`Camera interruption over.`)}
          onError={(error) => console.error(`Camera error:`, error)}
        />
      )}

      <FullOverlay style={safePadding}>
        <Row>
          <View style={styles.flex} />
          <CameraSelectorButton
            devices={devices}
            setDevice={(d) => {
              setDevice(d)
            }}
          />
        </Row>
        <View style={styles.flex} />

        <View style={styles.captureButtonRow}>
          <CaptureButton
            takePhoto={takePhoto}
            startRecording={startRecording}
            stopRecording={stopRecording}
          />
        </View>
      </FullOverlay>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  camera: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDevice: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  text: {
    color: 'white',
  },
  captureButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
})
