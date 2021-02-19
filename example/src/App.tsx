import * as React from 'react';
import { useRef, useState, useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { PinchGestureHandler, PinchGestureHandlerGestureEvent, State, TapGestureHandler, TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import { Navigation, NavigationFunctionComponent } from 'react-native-navigation';
import type { CameraDevice, CameraDeviceFormat, CameraProps, CameraRuntimeError, PhotoFile, VideoFile } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera';
import { useIsScreenFocused } from './hooks/useIsScreenFocused';
import { compareFormats, frameRateIncluded, formatWithClosestMatchingFps, compareDevices } from './FormatFilter';
import { CAPTURE_BUTTON_SIZE, CONTENT_SPACING, HIGH_FPS, MAX_ZOOM_FACTOR, SAFE_AREA_PADDING, SCREEN_WIDTH } from './Constants';
import Reanimated, { Extrapolate, interpolate, useAnimatedGestureHandler, useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useIsForeground } from './hooks/useIsForeground';
import { StatusBarBlurBackground } from './views/StatusBarBlurBackground';
import { CaptureButton } from './views/CaptureButton';
import { PressableOpacity } from './views/PressableOpacity';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

const SCALE_FULL_ZOOM = 3;
const BUTTON_SIZE = 40;
const LOCAL_GALLERY_BUTTON_SIZE = 40;

export const App: NavigationFunctionComponent = ({ componentId }) => {
  const camera = useRef<Camera>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const zoom = useSharedValue(0);
  const isPressingButton = useSharedValue(false);

  // check if camera page is active
  const isFocussed = useIsScreenFocused(componentId);
  const isForeground = useIsForeground();
  const isActive = isFocussed && isForeground;

  const [cameraPosition, setCameraPosition] = useState<"front" | "back">(
    "back"
  );
  const [enableHdr, setEnableHdr] = useState(false);
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [enableNightMode, setEnableNightMode] = useState(false);

  // camera format settings
  const [devices, setDevices] = useState<CameraDevice[]>([]); // All available camera devices, sorted by "best device" (descending)
  const device = useMemo<CameraDevice | undefined>(
    () => devices.find((d) => d.position === cameraPosition),
    [cameraPosition, devices]
  );
  const formats = useMemo<CameraDeviceFormat[]>(
    () => device?.formats.sort(compareFormats) ?? [],
    [device?.formats]
  );

  //#region Memos
  const fps = useMemo(() => {
    if (enableNightMode && !device?.supportsLowLightBoost) {
      // User has enabled Night Mode, but Night Mode is not natively supported, so we simulate it by lowering the frame rate.
      return 30;
    }

    const supportsHdrAtHighFps = formats.some(
      (f) =>
        f.supportsVideoHDR &&
        f.frameRateRanges.some((r) => frameRateIncluded(r, HIGH_FPS))
    );
    if (enableHdr && !supportsHdrAtHighFps) {
      // User has enabled HDR, but HDR is not supported at HIGH_FPS.
      return 30;
    }

    const supportsHighFps = formats.some((f) =>
      f.frameRateRanges.some((r) => frameRateIncluded(r, HIGH_FPS))
    );
    if (!supportsHighFps) {
      // HIGH_FPS is not supported by any format.
      return 30;
    }
    // If nothing blocks us from using it, we default to HIGH_FPS.
    return HIGH_FPS;
  }, [device, enableHdr, enableNightMode, formats,]);

  const supportsCameraFlipping = useMemo(
    () =>
      devices.some((d) => d.position === "back") &&
      devices.some((d) => d.position === "front"),
    [devices]
  );
  const supportsFlash = device?.hasFlash ?? false;
  const supportsHdr = useMemo(() => formats.some((f) => f.supportsVideoHDR), [
    formats,
  ]);
  const canToggleNightMode = enableNightMode
    ? true // it's enabled so you have to be able to turn it off again
    : (device?.supportsLowLightBoost ?? false) || fps > 30; // either we have native support, or we can lower the FPS
  //#endregion

  const format = useMemo(() => {
    let result = formats;
    if (enableHdr) {
      // We only filter by HDR capable formats if HDR is set to true.
      // Otherwise we ignore the `supportsVideoHDR` property and accept formats which support HDR `true` or `false`
      result = result.filter((f) => f.supportsVideoHDR);
    }

    return formatWithClosestMatchingFps(result, fps);
  }, [formats, fps, enableHdr]);

  //#region Animated Zoom
  const formatMaxZoom = format?.maxZoom ?? 1;
  const maxZoomFactor = Math.min(formatMaxZoom, MAX_ZOOM_FACTOR);
  const neutralZoom = device?.neutralZoom ?? 0;
  const neutralZoomScaled = (neutralZoom / maxZoomFactor) * formatMaxZoom;
  const maxZoomScaled = (1 / formatMaxZoom) * maxZoomFactor;

  const cameraAnimatedProps = useAnimatedProps<Partial<CameraProps>>(
    () => ({
      zoom: interpolate(
        zoom.value,
        [0, neutralZoomScaled, 1],
        [0, neutralZoom, maxZoomScaled],
        Extrapolate.CLAMP
      ),
    }),
    [maxZoomScaled, neutralZoom, neutralZoomScaled, zoom]
  );
  //#endregion

  //#region Callbacks
  const setIsPressingButton = useCallback(
    (_isPressingButton: boolean) => {
      isPressingButton.value = _isPressingButton;
    },
    [isPressingButton]
  );
  // Camera callbacks
  const onError = useCallback((error: CameraRuntimeError) => {
    console.error(error);
  }, []);
  const onInitialized = useCallback(() => {
    console.log(`Camera initialized!`);
    setIsCameraInitialized(true);
  }, []);
  const onMediaCaptured = useCallback(
    async (media: PhotoFile | VideoFile, type: "photo" | "video") => {
      console.log(`Media captured! ${JSON.stringify(media)}`);
      await Navigation.showModal({
        component: {
          name: 'Media',
          passProps: {
            type: type,
            path: media.path,
          }
        }
      })
    },
    []
  );
  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((p) => (p === "back" ? "front" : "back"));
  }, []);
  const onHdrSwitchPressed = useCallback(() => {
    setEnableHdr((h) => !h);
  }, []);
  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === "off" ? "on" : "off"));
  }, []);
  const onNightModePressed = useCallback(() => {
    setEnableNightMode((n) => !n);
  }, []);
  const onSettingsPressed = useCallback(() => {
    Navigation.push(componentId, { component: { name: 'Settings' } })
  }, [componentId]);
  //#endregion

  //#region Tap Gesture
  const onDoubleTapGesture = useCallback(
    ({ nativeEvent: event }: TapGestureHandlerStateChangeEvent) => {
      // TODO: (MARC) Allow switching camera (back <-> front) while recording and stich videos together!
      if (isPressingButton.value) return;
      switch (event.state) {
        case State.END:
          // on double tap
          onFlipCameraPressed();
          break;
        default:
          break;
      }
    },
    [isPressingButton, onFlipCameraPressed]
  );
  //#endregion

  //#region Effects
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const availableCameraDevices = await Camera.getAvailableCameraDevices();
        console.log(`Devices: ${availableCameraDevices.map((d) => d.name).join(", ")}`);
        const sortedDevices = availableCameraDevices.sort(compareDevices);
        console.debug(`Devices (sorted): ${sortedDevices.map((d) => d.name).join(", ")}`);
        setDevices(sortedDevices);
      } catch (e) {
        console.error(`Failed to get available devices!`, e);
      }
    };
    loadDevices();
  }, []);
  useEffect(() => {
    // Run everytime the neutralZoomScaled value changes. (reset zoom when device changes)
    zoom.value = neutralZoomScaled;
  }, [neutralZoomScaled, zoom]);

  useEffect(() => {
    // Run everytime the camera gets set to isActive = false. (reset zoom when tab switching)
    if (!isActive) {
      zoom.value = neutralZoomScaled;
    }
  }, [neutralZoomScaled, isActive, zoom]);
  //#endregion

  //#region Pinch to Zoom Gesture
  // The gesture handler maps the linear pinch gesture (0 - 1) to an exponential curve since a camera's zoom
  // function does not appear linear to the user. (aka zoom 0.1 -> 0.2 does not look equal in difference as 0.8 -> 0.9)
  const onPinchGesture = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent, { startZoom?: number }>({
    onStart: (_, context) => {
      context.startZoom = zoom.value;
    },
    onActive: (event, context) => {
      // we're trying to map the scale gesture to a linear zoom here
      const startZoom = context.startZoom ?? 0;
      const scale = interpolate(
        event.scale,
        [1 - 1 / SCALE_FULL_ZOOM, 1, SCALE_FULL_ZOOM],
        [-1, 0, 1],
        Extrapolate.CLAMP
      );
      zoom.value = interpolate(
        scale,
        [-1, 0, 1],
        [0, startZoom, 1],
        Extrapolate.CLAMP
      );
    },
  });
  //#endregion

  if (device != null && format != null) {
    console.log(`Re-rendering camera page with ${isActive ? "active" : "inactive"} camera. `
      + `Device: "${device.name}" (${format.photoWidth}x${format.photoHeight} @ ${fps}fps)`);
  } else {
    console.log(`re-rendering camera page without active camera`);
  }

  // TODO: Implement camera flipping (back <-> front) while recording and stich the videos together
  // TODO: iOS: Use custom video data stream output to manually process the data and write the MOV/MP4 for more customizability.
  return (
    <View style={styles.container}>
      {device != null && (
        <PinchGestureHandler onGestureEvent={onPinchGesture} enabled={isActive}>
          <Reanimated.View style={StyleSheet.absoluteFill}>
            <TapGestureHandler
              onHandlerStateChange={onDoubleTapGesture}
              numberOfTaps={2}>
              <ReanimatedCamera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={device}
                format={format}
                fps={fps}
                hdr={enableHdr}
                lowLightBoost={
                  device.supportsLowLightBoost && enableNightMode
                }
                isActive={isActive}
                onInitialized={onInitialized}
                onError={onError}
                enableZoomGesture={false}
                // TODO: Remove once https://github.com/software-mansion/react-native-reanimated/pull/1697 gets merged
                // @ts-expect-error animatedProps should be Partial<P>
                animatedProps={cameraAnimatedProps}
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
        flash={supportsFlash ? flash : "off"}
        enabled={isCameraInitialized && isActive}
        setIsPressingButton={setIsPressingButton}
      />

      <StatusBarBlurBackground />

      <View style={styles.rightButtonRow}>
        {supportsCameraFlipping && (
          <PressableOpacity
            style={styles.button}
            onPress={onFlipCameraPressed}
            disabledOpacity={0.4}>
            <IonIcon
              name="camera-reverse"
              color="white"
              size={24}
            />
          </PressableOpacity>
        )}
        {supportsFlash && (
          <PressableOpacity
            style={styles.button}
            onPress={onFlashPressed}
            disabledOpacity={0.4}>
            <IonIcon
              name={flash === "on" ? "flash" : "flash-off"}
              color="white"
              size={24}
            />
          </PressableOpacity>
        )}
        {canToggleNightMode && (
          <PressableOpacity
            style={styles.button}
            onPress={onNightModePressed}
            disabledOpacity={0.4}>
            <IonIcon
              name={enableNightMode ? "moon" : "moon-outline"}
              color="white"
              size={24}
            />
          </PressableOpacity>
        )}
        {supportsHdr && (
          <PressableOpacity style={styles.button} onPress={onHdrSwitchPressed}>
            <MaterialIcon
              name={enableHdr ? "hdr" : "hdr-off"}
              color="white"
              size={24}
            />
          </PressableOpacity>
        )}
        <PressableOpacity style={styles.button} onPress={onSettingsPressed}>
          <IonIcon
            name="settings-outline"
            color="white"
            size={24}
          />
        </PressableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  captureButton: {
    position: "absolute",
    alignSelf: "center",
    bottom: SAFE_AREA_PADDING.paddingBottom
  },
  openLocalGalleryButton: {
    position: "absolute",
    left: (SCREEN_WIDTH / 2 - CAPTURE_BUTTON_SIZE / 2) / 2,
    width: LOCAL_GALLERY_BUTTON_SIZE,
    height: LOCAL_GALLERY_BUTTON_SIZE,
    marginBottom: CAPTURE_BUTTON_SIZE / 2 - LOCAL_GALLERY_BUTTON_SIZE / 2,
  },
  button: {
    marginTop: CONTENT_SPACING,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "rgba(140, 140, 140, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  rightButtonRow: {
    position: "absolute",
    right: CONTENT_SPACING,
    top: SAFE_AREA_PADDING.paddingTop
  },
});
