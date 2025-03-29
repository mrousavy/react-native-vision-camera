import * as React from 'react'
import { useRef, useState, useCallback, useMemo } from 'react'
import type { GestureResponderEvent } from 'react-native'
import { StyleSheet, Text, View, SafeAreaView } from 'react-native'
import type { PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import { PinchGestureHandler, TapGestureHandler } from 'react-native-gesture-handler'
import type { CameraProps, CameraRuntimeError, PhotoFile, VideoFile } from 'react-native-vision-camera'
import {
  useCameraDevice,
  useCameraFormat,
  useFrameProcessor,
  useLocationPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera'
import { Camera } from 'react-native-vision-camera'
import { CONTENT_SPACING, CONTROL_BUTTON_SIZE, MAX_ZOOM_FACTOR, SAFE_AREA_PADDING, SCREEN_HEIGHT, SCREEN_WIDTH } from './Constants'
import Reanimated, { Extrapolate, interpolate, useAnimatedGestureHandler, useAnimatedProps, useSharedValue } from 'react-native-reanimated'
import { Worklets } from 'react-native-worklets-core'
import { useEffect } from 'react'
import { useIsForeground } from './hooks/useIsForeground'
import { StatusBarBlurBackground } from './views/StatusBarBlurBackground'
import { CaptureButton } from './views/CaptureButton'
import { PressableOpacity } from 'react-native-pressable-opacity'
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import IonIcon from 'react-native-vector-icons/Ionicons'

// Add type assertions to fix TypeScript errors
const TypedIonIcon = IonIcon as unknown as React.ComponentType<any>
const TypedMaterialIcon = MaterialIcon as unknown as React.ComponentType<any>
import type { Routes } from './Routes'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useIsFocused } from '@react-navigation/core'
import { usePreferredCameraDevice } from './hooks/usePreferredCameraDevice'
// Import the updated pose detection plugin and overlay component
import { detectPose, PoseModelType, PoseDetectionResult } from './frame-processors/PoseDetectionPlugin'
import PoseSkeletonOverlay from './PoseSkeletonOverlay'

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
  
  // State for frame processor and pose detection results
  const [poseDetectionEnabled, setPoseDetectionEnabled] = useState(false)
  const [poseModelType, setPoseModelType] = useState<PoseModelType>(PoseModelType.Thunder)
  const [poseStats, setPoseStats] = useState<string>('')
  const [lastFrameTime, setLastFrameTime] = useState<string>('')
  const [frameProcessorActive, setFrameProcessorActive] = useState<boolean>(false)
  const [pluginResults, setPluginResults] = useState<string>('')
  
  // Add state for storing pose detection results
  const [poseData, setPoseData] = useState<PoseDetectionResult | null>(null)
  
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
    { videoResolution: 'max' },
    { photoAspectRatio: screenAspectRatio },
    { photoResolution: 'max' },
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

  // Create worklet callbacks for UI updates using Worklets.createRunOnJS
  const updateFrameProcessorStatus = Worklets.createRunOnJS((isActive: boolean) => {
    setFrameProcessorActive(isActive)
  })
  
  const updateFrameTime = Worklets.createRunOnJS((time: string) => {
    setLastFrameTime(time)
  })
  
  const updatePluginResults = Worklets.createRunOnJS((results: string) => {
    setPluginResults(results)
  })
  
  const updatePoseStats = Worklets.createRunOnJS((stats: string) => {
    setPoseStats(stats)
  })
  
  // New worklet callback for updating pose data in the UI
  const updatePoseData = Worklets.createRunOnJS((data: PoseDetectionResult | null) => {
    setPoseData(data)
  })
  
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    
    // Send initial frame processor active status
    updateFrameProcessorStatus(true)
    
    // Create timestamp for this frame
    const timeStr = new Date().toLocaleTimeString()
    updateFrameTime(timeStr)
    
    try {
      // Process pose detection if enabled
      if (poseDetectionEnabled) {
        try {
          console.log(`[POSE] Attempting detection with model: ${poseModelType}`)
          
          // Call the native pose detection plugin with normalized coordinates option
          const poseData = detectPose(frame, poseModelType, {
            drawSkeleton: false, // We'll draw in JS now
            minConfidence: 0.3
          })
          
          console.log(`[POSE] Detection successful: ${JSON.stringify(poseData)}`)
          
          // Format stats about the pose detection
          const poseStatsStr = `Model: ${poseModelType} | Points: ${poseData.keypointsDetected}`
          updatePoseStats(poseStatsStr)
          
          // Update UI with pose detection results
          updatePluginResults(`Pose Detection: ${poseStatsStr}`)
          
          // Update pose data state for rendering the overlay
          updatePoseData(poseData)
        } catch (poseError) {
          console.log(`[POSE] Detection error: ${String(poseError)}`)
          console.log(`[POSE] Error details:`, poseError)
          
          updatePluginResults(`Pose Error: ${String(poseError)}`)
          updatePoseStats('Error detecting pose')
          updatePoseData(null)
        }
      } else {
        // Clear results when pose detection is disabled
        updatePluginResults('Pose detection disabled')
        updatePoseStats('')
        updatePoseData(null)
      }
    } catch (error) {
      console.log(`Frame processor error: ${String(error)}`)
      updatePluginResults(`Error: ${String(error)}`)
      updatePoseData(null)
    }
  }, [
    updateFrameProcessorStatus, 
    updateFrameTime, 
    updatePluginResults, 
    updatePoseStats, 
    updatePoseData,
    poseDetectionEnabled, 
    poseModelType
  ])

  const videoHdr = format?.supportsVideoHdr && enableHdr
  const photoHdr = format?.supportsPhotoHdr && enableHdr && !videoHdr

  return (
    <View style={styles.container}>
      {/* React Native Pose Skeleton Overlay - render when pose data is available */}
      {poseDetectionEnabled && poseData && (
        <PoseSkeletonOverlay 
          poseData={poseData}
          mirrored={cameraPosition === 'front'}
          confidenceThreshold={0.3}
          keyPointColor="#00FF00"
          connectionColor="#FFFF00"
        />
      )}
      
      {/* Frame Processor Debug Overlay */}
      {frameProcessorActive && (
        <SafeAreaView style={styles.frameProcessorOverlay}>
          <View style={styles.frameProcessorStatus}>
            <Text style={styles.frameProcessorText}>Frame Processor Active</Text>
            <Text style={styles.frameProcessorText}>Last Frame: {lastFrameTime}</Text>
            <Text style={styles.frameProcessorText}>{pluginResults}</Text>
            {poseDetectionEnabled && (
              <Text style={styles.frameProcessorText}>Pose Detection: {poseStats}</Text>
            )}
          </View>
        </SafeAreaView>
      )}
      
      {device != null ? (
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
                onStarted={() => console.log('Camera started!')}
                onStopped={() => console.log('Camera stopped!')}
                onPreviewStarted={() => console.log('Preview started!')}
                onPreviewStopped={() => console.log('Preview stopped!')}
                onOutputOrientationChanged={(o) => console.log(`Output orientation changed to ${o}!`)}
                onPreviewOrientationChanged={(o) => console.log(`Preview orientation changed to ${o}!`)}
                onUIRotationChanged={(degrees) => console.log(`UI Rotation changed: ${degrees}°`)}
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
                outputOrientation="device"
                photo={true}
                video={true}
                audio={microphone.hasPermission}
                enableLocation={location.hasPermission}
                frameProcessor={frameProcessor}
              />
            </TapGestureHandler>
          </Reanimated.View>
        </PinchGestureHandler>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.text}>Your phone does not have a Camera.</Text>
        </View>
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
          <TypedIonIcon name="camera-reverse" color="white" size={24} />
        </PressableOpacity>
        {supportsFlash && (
          <PressableOpacity style={styles.button} onPress={onFlashPressed} disabledOpacity={0.4}>
            <TypedIonIcon name={flash === 'on' ? 'flash' : 'flash-off'} color="white" size={24} />
          </PressableOpacity>
        )}
        {supports60Fps && (
          <PressableOpacity style={styles.button} onPress={() => setTargetFps((t) => (t === 30 ? 60 : 30))}>
            <Text style={styles.text}>{`${targetFps}\nFPS`}</Text>
          </PressableOpacity>
        )}
        {supportsHdr && (
          <PressableOpacity style={styles.button} onPress={() => setEnableHdr((h) => !h)}>
            <TypedMaterialIcon name={enableHdr ? 'hdr' : 'hdr-off'} color="white" size={24} />
          </PressableOpacity>
        )}
        {canToggleNightMode && (
          <PressableOpacity style={styles.button} onPress={() => setEnableNightMode(!enableNightMode)} disabledOpacity={0.4}>
            <TypedIonIcon name={enableNightMode ? 'moon' : 'moon-outline'} color="white" size={24} />
          </PressableOpacity>
        )}
        {/* Pose detection toggle button */}
        <PressableOpacity 
          style={styles.button} 
          onPress={() => setPoseDetectionEnabled(!poseDetectionEnabled)}
        >
          <TypedMaterialIcon 
            name="human-handsup" 
            color={poseDetectionEnabled ? "#00FF00" : "white"} 
            size={24} 
          />
        </PressableOpacity>
        
        {/* Pose model toggle (only if pose detection is enabled) */}
        {poseDetectionEnabled && (
          <PressableOpacity 
            style={styles.button} 
            onPress={() => setPoseModelType(poseModelType === PoseModelType.Thunder ? 
              PoseModelType.Lightning : PoseModelType.Thunder)}
          >
            <TypedIonIcon 
              name={poseModelType === PoseModelType.Thunder ? "flash" : "flash-outline"} 
              color={"white"} 
              size={24} 
            />
          </PressableOpacity>
        )}
        
        <PressableOpacity style={styles.button} onPress={() => navigation.navigate('Devices')}>
          <TypedIonIcon name="settings-outline" color="white" size={24} />
        </PressableOpacity>
        <PressableOpacity style={styles.button} onPress={() => navigation.navigate('CodeScannerPage')}>
          <TypedIonIcon name="qr-code-outline" color="white" size={24} />
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
  frameProcessorOverlay: {
    position: 'absolute',
    bottom: 120, // Positioned above the capture button
    left: 10,
    zIndex: 1000,
    alignItems: 'flex-start', // Align to the left
  },
  frameProcessorStatus: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
    maxWidth: '60%', // Smaller to fit on the left side
  },
  frameProcessorText: {
    color: '#00FF00',
    fontSize: 12,
    marginBottom: 4,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})