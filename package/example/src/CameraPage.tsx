import * as React from 'react'
import { useRef, useState, useCallback, useMemo } from 'react'
import type { GestureResponderEvent } from 'react-native'
import { StyleSheet, Text, View } from 'react-native'
import type { PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import { PinchGestureHandler, TapGestureHandler } from 'react-native-gesture-handler'
import type { CameraProps, CameraRuntimeError, PhotoFile, VideoFile } from 'react-native-vision-camera'
import { VisionCameraProxy } from 'react-native-vision-camera'
import {
  runAtTargetFps,
  useCameraDevice,
  useCameraFormat,
  useSkiaFrameProcessor,
  useLocationPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera'
import { Camera } from 'react-native-vision-camera'
import { CONTENT_SPACING, CONTROL_BUTTON_SIZE, MAX_ZOOM_FACTOR, SAFE_AREA_PADDING, SCREEN_HEIGHT, SCREEN_WIDTH } from './Constants'
import Reanimated, { Extrapolate, interpolate, useAnimatedGestureHandler, useAnimatedProps, useSharedValue } from 'react-native-reanimated'
import { useEffect } from 'react'
import { useIsForeground } from './hooks/useIsForeground'
import { StatusBarBlurBackground } from './views/StatusBarBlurBackground'
import { CaptureButton } from './views/CaptureButton'
import { PressableOpacity } from 'react-native-pressable-opacity'
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import IonIcon from 'react-native-vector-icons/Ionicons'
import type { Routes } from './Routes'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useIsFocused } from '@react-navigation/core'
import { usePreferredCameraDevice } from './hooks/usePreferredCameraDevice'
import { examplePlugin } from './frame-processors/ExamplePlugin'
import { exampleKotlinSwiftPlugin } from './frame-processors/ExampleKotlinSwiftPlugin'
import { ColorChannel, Paint, PaintStyle, PointMode, Skia, StrokeJoin, TileMode } from '@shopify/react-native-skia'

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)
Reanimated.addWhitelistedNativeProps({
  zoom: true,
})

const SCALE_FULL_ZOOM = 3

type Props = NativeStackScreenProps<Routes, 'CameraPage'>
export function CameraPage({ navigation }: Props): React.ReactElement {
  const camera = useRef<Camera>(null)
  const [isCameraInitialized, setIsCameraInitialized] = useState(false)
  const microphone = useMicrophonePermission()
  const location = useLocationPermission()
  const zoom = useSharedValue(1)
  const isPressingButton = useSharedValue(false)

  // check if camera page is active
  const isFocussed = useIsFocused()
  const isForeground = useIsForeground()
  const isActive = isFocussed && isForeground

  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back')
  const [enableHdr, setEnableHdr] = useState(false)
  const [flash, setFlash] = useState<'off' | 'on'>('off')
  const [enableNightMode, setEnableNightMode] = useState(false)

  // camera device settings
  const [preferredDevice] = usePreferredCameraDevice()
  let device = useCameraDevice(cameraPosition)

  if (preferredDevice != null && preferredDevice.position === cameraPosition) {
    // override default device with the one selected by the user in settings
    device = preferredDevice
  }

  const [targetFps, setTargetFps] = useState(60)

  const screenAspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH
  const format = useCameraFormat(device, [
    { fps: targetFps },
    { videoAspectRatio: screenAspectRatio },
    { videoResolution: { width: 720, height: 1080 } },
  ])

  const fps = Math.min(format?.maxFps ?? 1, targetFps)

  const supportsFlash = device?.hasFlash ?? false
  const supportsHdr = format?.supportsPhotoHdr
  const supports60Fps = useMemo(() => device?.formats.some((f) => f.maxFps >= 60), [device?.formats])
  const canToggleNightMode = device?.supportsLowLightBoost ?? false

  //#region Animated Zoom
  const minZoom = device?.minZoom ?? 1
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR)

  const cameraAnimatedProps = useAnimatedProps<CameraProps>(() => {
    const z = Math.max(Math.min(zoom.value, maxZoom), minZoom)
    return {
      zoom: z,
    }
  }, [maxZoom, minZoom, zoom])
  //#endregion

  //#region Callbacks
  const setIsPressingButton = useCallback(
    (_isPressingButton: boolean) => {
      isPressingButton.value = _isPressingButton
    },
    [isPressingButton],
  )
  const onError = useCallback((error: CameraRuntimeError) => {
    console.error(error)
  }, [])
  const onInitialized = useCallback(() => {
    console.log('Camera initialized!')
    setIsCameraInitialized(true)
  }, [])
  const onMediaCaptured = useCallback(
    (media: PhotoFile | VideoFile, type: 'photo' | 'video') => {
      console.log(`Media captured! ${JSON.stringify(media)}`)
      navigation.navigate('MediaPage', {
        path: media.path,
        type: type,
      })
    },
    [navigation],
  )
  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((p) => (p === 'back' ? 'front' : 'back'))
  }, [])
  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === 'off' ? 'on' : 'off'))
  }, [])
  //#endregion

  //#region Tap Gesture
  const onFocusTap = useCallback(
    ({ nativeEvent: event }: GestureResponderEvent) => {
      if (!device?.supportsFocus) return
      camera.current?.focus({
        x: event.locationX,
        y: event.locationY,
      })
    },
    [device?.supportsFocus],
  )
  const onDoubleTap = useCallback(() => {
    onFlipCameraPressed()
  }, [onFlipCameraPressed])
  //#endregion

  //#region Effects
  useEffect(() => {
    // Reset zoom to it's default everytime the `device` changes.
    zoom.value = device?.neutralZoom ?? 1
  }, [zoom, device])
  //#endregion

  //#region Pinch to Zoom Gesture
  // The gesture handler maps the linear pinch gesture (0 - 1) to an exponential curve since a camera's zoom
  // function does not appear linear to the user. (aka zoom 0.1 -> 0.2 does not look equal in difference as 0.8 -> 0.9)
  const onPinchGesture = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent, { startZoom?: number }>({
    onStart: (_, context) => {
      context.startZoom = zoom.value
    },
    onActive: (event, context) => {
      // we're trying to map the scale gesture to a linear zoom here
      const startZoom = context.startZoom ?? 0
      const scale = interpolate(event.scale, [1 - 1 / SCALE_FULL_ZOOM, 1, SCALE_FULL_ZOOM], [-1, 0, 1], Extrapolate.CLAMP)
      zoom.value = interpolate(scale, [-1, 0, 1], [minZoom, startZoom, maxZoom], Extrapolate.CLAMP)
    },
  })
  //#endregion

  useEffect(() => {
    const f =
      format != null
        ? `(${format.photoWidth}x${format.photoHeight} photo / ${format.videoWidth}x${format.videoHeight}@${format.maxFps} video @ ${fps}fps)`
        : undefined
    console.log(`Camera: ${device?.name} | Format: ${f}`)
  }, [device?.name, format, fps])

  useEffect(() => {
    location.requestPermission()
  }, [location])

  interface Pos {
    x: number
    y: number
    width: number
    height: number
  }
  interface Landmark {
    x: number
    y: number
    z: number
    visibility?: number
  }
  interface Hand {
    landmarks: Landmark[]
  }

  const rectPaint = Skia.Paint()
  rectPaint.setColor(Skia.Color('red'))
  rectPaint.setStyle(PaintStyle.Stroke)
  rectPaint.setStrokeWidth(10)
  rectPaint.setStrokeJoin(StrokeJoin.Round)

  const red = Skia.Paint()
  red.setColor(Skia.Color('red'))

  const green = Skia.Paint()
  green.setColor(Skia.Color('#2c944b'))
  green.setStrokeWidth(5)

  const effect = Skia.RuntimeEffect.Make(
    `
    uniform shader image;

vec4 chromatic(vec2 pos, float offset) {
  float r = image.eval(pos).r;
  float g = image.eval(vec2(pos.x + offset, pos.y)).g;
  float b = image.eval(vec2(pos.x + offset * 2.0, pos.y)).b;
  return vec4(r, g, b, 1.0);
}

half4 main(vec2 pos) {
  float offset = 50.0;
  return chromatic(pos, offset);
}

    `,
  )
  if (effect == null) throw new Error('Failed to compile SKSL!')
  const shader = Skia.RuntimeShaderBuilder(effect)

  const invert = Skia.RuntimeShaderBuilder(
    Skia.RuntimeEffect.Make(`
  uniform shader image;

half4 main(vec2 pos) {
  vec4 color = image.eval(pos);
  return vec4(1.0 - color.rgb, 1.0);
}
`),
  )

  const p = Skia.Paint()

  const lines = useMemo(
    () =>
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [0, 5],
        [5, 6],
        [6, 7],
        [7, 8],
        [5, 9],
        [9, 10],
        [10, 11],
        [11, 12],
        [9, 13],
        [13, 14],
        [14, 15],
        [15, 16],
        [13, 17],
        [17, 18],
        [18, 19],
        [19, 20],
        [0, 17],
      ] as const,
    [],
  )

  type Samples = 'object-detection' | 'hand-detection' | 'vhs' | 'invert'

  const plugin = useMemo(() => VisionCameraProxy.initFrameProcessorPlugin('object_detector_plugin', {}), [])

  const demo = useMemo(() => Worklets.createSharedValue<Samples>('hand-detection'), [])

  const frameProcessor = useSkiaFrameProcessor(
    (frame) => {
      'worklet'

      switch (demo.value) {
        case 'vhs':
          p.setImageFilter(Skia.ImageFilter.MakeRuntimeShader(shader, null, null))
          frame.render(p)
          break
        case 'invert':
          p.setImageFilter(Skia.ImageFilter.MakeRuntimeShader(invert, null, null))
          frame.render(p)
          break

        case 'object-detection': {
          frame.render()

          const results = plugin?.call(frame) as undefined | Pos[]
          if (results == null) return
          for (const r of results) {
            const rect = Skia.XYWHRect(r.x, r.y, r.width, r.height)
            frame.drawRect(rect, rectPaint)
          }
          break
        }
        case 'hand-detection': {
          frame.render()

          const hands = exampleKotlinSwiftPlugin(frame) as unknown as Hand[]

          const width = frame.width
          const height = frame.height

          for (const hand of hands) {
            const points = hand.landmarks.map((l) => ({
              point: Skia.Point(l.x * width, l.y * height),
              opacity: l.visibility,
            }))

            for (const line of lines) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              const from = points[line[0]]!
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              const to = points[line[1]]!
              green.setAlphaf(Math.min(from.opacity ?? 1, to.opacity ?? 1))
              frame.drawLine(from.point.x, from.point.y, to.point.x, to.point.y, green)
            }
            for (const { point, opacity } of points) {
              red.setAlphaf(opacity ?? 1)
              frame.drawCircle(point.x, point.y, 10, red)
            }
          }
          break
        }
      }
    },
    [demo, p, shader, invert, plugin, rectPaint, lines, green, red],
  )

  useEffect(() => {
    const i = setInterval(() => {
      switch (demo.value) {
        case 'hand-detection':
          demo.value = 'invert'
          break
        case 'invert':
          demo.value = 'vhs'
          break
        case 'vhs':
          demo.value = 'object-detection'
          break
        case 'object-detection':
          demo.value = 'hand-detection'
          break
      }
    }, 2000)
    return () => clearInterval(i)
  }, [demo])

  const videoHdr = format?.supportsVideoHdr && enableHdr
  const photoHdr = format?.supportsPhotoHdr && enableHdr && !videoHdr

  return (
    <View style={styles.container}>
      {device != null && (
        <PinchGestureHandler onGestureEvent={onPinchGesture} enabled={isActive}>
          <Reanimated.View onTouchEnd={onFocusTap} style={StyleSheet.absoluteFill}>
            <TapGestureHandler onEnded={onDoubleTap} numberOfTaps={2}>
              <ReanimatedCamera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isActive}
                ref={camera}
                onInitialized={onInitialized}
                onError={onError}
                onStarted={() => 'Camera started!'}
                onStopped={() => 'Camera stopped!'}
                format={format}
                fps={fps}
                photoHdr={photoHdr}
                videoHdr={videoHdr}
                photoQualityBalance="quality"
                lowLightBoost={device.supportsLowLightBoost && enableNightMode}
                enableZoomGesture={false}
                animatedProps={cameraAnimatedProps}
                exposure={0}
                enableFpsGraph={true}
                orientation="portrait"
                photo={true}
                video={true}
                audio={microphone.hasPermission}
                enableLocation={location.hasPermission}
                frameProcessor={frameProcessor}
                pixelFormat="rgb"
              />
            </TapGestureHandler>
          </Reanimated.View>
        </PinchGestureHandler>
      )}

      <CaptureButton
        style={styles.captureButton}
        camera={camera}
        onMediaCaptured={onMediaCaptured}
        cameraZoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        flash={supportsFlash ? flash : 'off'}
        enabled={isCameraInitialized && isActive}
        setIsPressingButton={setIsPressingButton}
      />

      <StatusBarBlurBackground />

      <View style={styles.rightButtonRow}>
        <PressableOpacity style={styles.button} onPress={onFlipCameraPressed} disabledOpacity={0.4}>
          <IonIcon name="camera-reverse" color="white" size={24} />
        </PressableOpacity>
        {supportsFlash && (
          <PressableOpacity style={styles.button} onPress={onFlashPressed} disabledOpacity={0.4}>
            <IonIcon name={flash === 'on' ? 'flash' : 'flash-off'} color="white" size={24} />
          </PressableOpacity>
        )}
        {supports60Fps && (
          <PressableOpacity style={styles.button} onPress={() => setTargetFps((t) => (t === 30 ? 60 : 30))}>
            <Text style={styles.text}>{`${targetFps}\nFPS`}</Text>
          </PressableOpacity>
        )}
        {supportsHdr && (
          <PressableOpacity style={styles.button} onPress={() => setEnableHdr((h) => !h)}>
            <MaterialIcon name={enableHdr ? 'hdr' : 'hdr-off'} color="white" size={24} />
          </PressableOpacity>
        )}
        {canToggleNightMode && (
          <PressableOpacity style={styles.button} onPress={() => setEnableNightMode(!enableNightMode)} disabledOpacity={0.4}>
            <IonIcon name={enableNightMode ? 'moon' : 'moon-outline'} color="white" size={24} />
          </PressableOpacity>
        )}
        <PressableOpacity style={styles.button} onPress={() => navigation.navigate('Devices')}>
          <IonIcon name="settings-outline" color="white" size={24} />
        </PressableOpacity>
        <PressableOpacity style={styles.button} onPress={() => navigation.navigate('CodeScannerPage')}>
          <IonIcon name="qr-code-outline" color="white" size={24} />
        </PressableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  captureButton: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: SAFE_AREA_PADDING.paddingBottom,
  },
  button: {
    marginBottom: CONTENT_SPACING,
    width: CONTROL_BUTTON_SIZE,
    height: CONTROL_BUTTON_SIZE,
    borderRadius: CONTROL_BUTTON_SIZE / 2,
    backgroundColor: 'rgba(140, 140, 140, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtonRow: {
    position: 'absolute',
    right: SAFE_AREA_PADDING.paddingRight,
    top: SAFE_AREA_PADDING.paddingTop,
  },
  text: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})
