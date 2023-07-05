import * as React from 'react';
import { useRef, useState, useMemo, useCallback } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { PinchGestureHandler, PinchGestureHandlerGestureEvent, TapGestureHandler } from 'react-native-gesture-handler';
import {
  CameraDeviceFormat,
  CameraRuntimeError,
  PhotoFile,
  sortFormats,
  useCameraDevices,
  useFrameProcessor,
  VideoFile,
} from 'react-native-vision-camera';
import { Camera, frameRateIncluded } from 'react-native-vision-camera';
import { CONTENT_SPACING, MAX_ZOOM_FACTOR, SAFE_AREA_PADDING } from './Constants';
import Reanimated, { Extrapolate, interpolate, useAnimatedGestureHandler, useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useIsForeground } from './hooks/useIsForeground';
import { StatusBarBlurBackground } from './views/StatusBarBlurBackground';
import { CaptureButton } from './views/CaptureButton';
import { PressableOpacity } from 'react-native-pressable-opacity';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import type { Routes } from './Routes';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/core';
import { PaintStyle, Skia } from '@shopify/react-native-skia';
import { CHROMATIC_ABERRATION_SHADER, FACE_PIXELATED_SHADER, FACE_SHADER, INVERTED_COLORS_SHADER } from './Shaders';
import { detectFaces } from './frame-processors/FaceDetection';
import { useSharedValue as useWorkletValue } from 'react-native-worklets/src';
import { detectHands } from './frame-processors/HandDetection';

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

const SCALE_FULL_ZOOM = 3;
const BUTTON_SIZE = 40;

type Props = NativeStackScreenProps<Routes, 'CameraPage'>;
export function CameraPage({ navigation }: Props): React.ReactElement {
  const camera = useRef<Camera>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState(false);
  const zoom = useSharedValue(0);
  const isPressingButton = useSharedValue(false);

  // check if camera page is active
  const isFocussed = useIsFocused();
  const isForeground = useIsForeground();
  const isActive = isFocussed && isForeground;

  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const [enableHdr, setEnableHdr] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [enableNightMode, setEnableNightMode] = useState(false);

  // camera format settings
  const devices = useCameraDevices();
  const device = devices[cameraPosition];
  const formats = useMemo<CameraDeviceFormat[]>(() => {
    if (device?.formats == null) return [];
    return device.formats.sort(sortFormats);
  }, [device?.formats]);

  //#region Memos
  const [is60Fps, setIs60Fps] = useState(true);
  const fps = useMemo(() => {
    if (!is60Fps) return 30;

    if (enableNightMode && !device?.supportsLowLightBoost) {
      // User has enabled Night Mode, but Night Mode is not natively supported, so we simulate it by lowering the frame rate.
      return 30;
    }

    const supportsHdrAt60Fps = formats.some((f) => f.supportsVideoHDR && f.frameRateRanges.some((r) => frameRateIncluded(r, 60)));
    if (enableHdr && !supportsHdrAt60Fps) {
      // User has enabled HDR, but HDR is not supported at 60 FPS.
      return 30;
    }

    const supports60Fps = formats.some((f) => f.frameRateRanges.some((r) => frameRateIncluded(r, 60)));
    if (!supports60Fps) {
      // 60 FPS is not supported by any format.
      return 30;
    }
    // If nothing blocks us from using it, we default to 60 FPS.
    return 60;
  }, [device?.supportsLowLightBoost, enableHdr, enableNightMode, formats, is60Fps]);

  const supportsCameraFlipping = useMemo(() => devices.back != null && devices.front != null, [devices.back, devices.front]);
  const supportsFlash = device?.hasFlash ?? false;
  const supportsHdr = useMemo(() => formats.some((f) => f.supportsVideoHDR || f.supportsPhotoHDR), [formats]);
  const supports60Fps = useMemo(() => formats.some((f) => f.frameRateRanges.some((rate) => frameRateIncluded(rate, 60))), [formats]);
  const canToggleNightMode = enableNightMode
    ? true // it's enabled so you have to be able to turn it off again
    : (device?.supportsLowLightBoost ?? false) || fps > 30; // either we have native support, or we can lower the FPS
  //#endregion

  const format = useMemo(() => {
    let result = formats;
    if (enableHdr) {
      // We only filter by HDR capable formats if HDR is set to true.
      // Otherwise we ignore the `supportsVideoHDR` property and accept formats which support HDR `true` or `false`
      result = result.filter((f) => f.supportsVideoHDR || f.supportsPhotoHDR);
    }

    result = result.filter((f) => f.frameRateRanges.some((r) => frameRateIncluded(r, fps)));

    // console.log({ result });

    // find the first format that includes the given FPS
    return result[0];
  }, [formats, fps, enableHdr]);

  //#region Animated Zoom
  // This just maps the zoom factor to a percentage value.
  // so e.g. for [min, neutr., max] values [1, 2, 128] this would result in [0, 0.0081, 1]
  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR);

  const cameraAnimatedProps = useAnimatedProps(() => {
    const z = Math.max(Math.min(zoom.value, maxZoom), minZoom);
    return {
      zoom: z,
    };
  }, [maxZoom, minZoom, zoom]);
  //#endregion

  //#region Callbacks
  const setIsPressingButton = useCallback(
    (_isPressingButton: boolean) => {
      isPressingButton.value = _isPressingButton;
    },
    [isPressingButton],
  );
  // Camera callbacks
  const onError = useCallback((error: CameraRuntimeError) => {
    console.error(error);
  }, []);
  const onInitialized = useCallback(() => {
    console.log('Camera initialized!');
    setIsCameraInitialized(true);
  }, []);
  const onMediaCaptured = useCallback(
    (media: PhotoFile | VideoFile, type: 'photo' | 'video') => {
      console.log(`Media captured! ${JSON.stringify(media)}`);
      navigation.navigate('MediaPage', {
        path: media.path,
        type: type,
      });
    },
    [navigation],
  );
  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((p) => (p === 'back' ? 'front' : 'back'));
  }, []);
  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === 'off' ? 'on' : 'off'));
  }, []);
  //#endregion

  //#region Tap Gesture
  const onDoubleTap = useCallback(() => {
    onFlipCameraPressed();
  }, [onFlipCameraPressed]);
  //#endregion

  //#region Effects
  const neutralZoom = device?.neutralZoom ?? 1;
  useEffect(() => {
    // Run everytime the neutralZoomScaled value changes. (reset zoom when device changes)
    zoom.value = neutralZoom;
  }, [neutralZoom, zoom]);

  useEffect(() => {
    Camera.getMicrophonePermissionStatus().then((status) => setHasMicrophonePermission(status === 'authorized'));
  }, []);
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
      const scale = interpolate(event.scale, [1 - 1 / SCALE_FULL_ZOOM, 1, SCALE_FULL_ZOOM], [-1, 0, 1], Extrapolate.CLAMP);
      zoom.value = interpolate(scale, [-1, 0, 1], [minZoom, startZoom, maxZoom], Extrapolate.CLAMP);
    },
  });
  //#endregion

  if (device != null && format != null) {
    console.log(
      `Re-rendering camera page with ${isActive ? 'active' : 'inactive'} camera. ` +
        `Device: "${device.name}" (${format.photoWidth}x${format.photoHeight} @ ${fps}fps)`,
    );
  } else {
    console.log('re-rendering camera page without active camera');
  }

  type EffectToUse = 'vhs' | 'invert-colors' | 'face-blur' | 'hand-detection';
  const effectToUse = useWorkletValue<EffectToUse>('vhs');

  useEffect(() => {
    const interval = setInterval(() => {
      console.log(effectToUse.value);
      switch (effectToUse.value) {
        case 'vhs':
          effectToUse.value = 'invert-colors';
          break;
        case 'invert-colors':
          effectToUse.value = 'hand-detection';
          break;
        case 'hand-detection':
          effectToUse.value = 'face-blur';
          break;
        case 'face-blur':
          effectToUse.value = 'vhs';
          break;
      }
      console.log(`Changed shader to ${effectToUse.value}!`);
    }, 3000);
    return () => {
      clearInterval(interval);
    };
  }, [effectToUse]);

  // blur face
  const blurEffect = Skia.RuntimeEffect.Make(FACE_PIXELATED_SHADER);
  if (blurEffect == null) throw new Error('Shader failed to compile!');
  const blurShaderBuilder = Skia.RuntimeShaderBuilder(blurEffect);
  const blurPaint = Skia.Paint();

  // VHS effect
  const vhsEffect = Skia.RuntimeEffect.Make(CHROMATIC_ABERRATION_SHADER);
  if (vhsEffect == null) throw new Error('Failed to compile VHS Effect!');
  const vhsShaderBuilder = Skia.RuntimeShaderBuilder(vhsEffect);
  const vhsPaint = Skia.Paint();
  vhsPaint.setImageFilter(Skia.ImageFilter.MakeRuntimeShader(vhsShaderBuilder, null, null));

  // invert colors
  const invertEffect = Skia.RuntimeEffect.Make(INVERTED_COLORS_SHADER);
  if (invertEffect == null) throw new Error('Failed to compile Inverted Effect!');
  const invertedShaderBuilder = Skia.RuntimeShaderBuilder(invertEffect);
  const invertedPaint = Skia.Paint();
  invertedPaint.setImageFilter(Skia.ImageFilter.MakeRuntimeShader(invertedShaderBuilder, null, null));

  const handPaint = Skia.Paint();
  handPaint.setStyle(PaintStyle.Stroke);
  handPaint.setStrokeWidth(10);
  handPaint.setColor(Skia.Color('lightgreen'));
  const dotPaint = Skia.Paint();
  dotPaint.setColor(Skia.Color('red'));
  dotPaint.setStyle(PaintStyle.Fill);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      // console.log(`Width: ${frame.width}`);

      if (effectToUse.value === 'vhs') {
        // VHS
        frame.render(vhsPaint);
      } else if (effectToUse.value === 'invert-colors') {
        // VHS
        frame.render(invertedPaint);
      } else if (effectToUse.value === 'face-blur') {
        const { faces } = detectFaces(frame);
        // console.log(faces);
        for (const face of faces) {
          const centerX = (face.x + face.width / 2) * frame.width;
          const centerY = (face.y + face.height / 2) * frame.height;
          const radius = Math.max(face.width * frame.width, face.height * frame.height) / 2;

          blurShaderBuilder.setUniform('x', [centerX]);
          blurShaderBuilder.setUniform('y', [centerY]);
          blurShaderBuilder.setUniform('r', [radius]);
          const imageFilter = Skia.ImageFilter.MakeRuntimeShader(blurShaderBuilder, null, null);
          blurPaint.setImageFilter(imageFilter);

          frame.render(blurPaint);
        }
      } else if (effectToUse.value === 'hand-detection') {
        const { hands } = detectHands(frame);

        for (const hand of hands) {
          const dist = Math.sqrt((hand.wrist.x - hand.middle_finger_tip.x) ** 2 + (hand.wrist.y - hand.middle_finger_tip.y) ** 2);
          const lineWidth = Math.min((dist * frame.width) / 10, frame.width * 0.007);
          const dotSize = Math.min((dist * frame.width) / 13, frame.width * 0.006);

          handPaint.setStrokeWidth(lineWidth);

          frame.drawLine(
            hand.wrist.x * frame.width,
            hand.wrist.y * frame.height,
            hand.thumb_cmc.x * frame.width,
            hand.thumb_cmc.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.thumb_cmc.x * frame.width,
            hand.thumb_cmc.y * frame.height,
            hand.thumb_mcp.x * frame.width,
            hand.thumb_mcp.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.thumb_mcp.x * frame.width,
            hand.thumb_mcp.y * frame.height,
            hand.thumb_ip.x * frame.width,
            hand.thumb_ip.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.thumb_ip.x * frame.width,
            hand.thumb_ip.y * frame.height,
            hand.thumb_tip.x * frame.width,
            hand.thumb_tip.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.wrist.x * frame.width,
            hand.wrist.y * frame.height,
            hand.index_finger_mcp.x * frame.width,
            hand.index_finger_mcp.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.index_finger_mcp.x * frame.width,
            hand.index_finger_mcp.y * frame.height,
            hand.index_finger_pip.x * frame.width,
            hand.index_finger_pip.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.index_finger_pip.x * frame.width,
            hand.index_finger_pip.y * frame.height,
            hand.index_finger_dip.x * frame.width,
            hand.index_finger_dip.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.index_finger_dip.x * frame.width,
            hand.index_finger_dip.y * frame.height,
            hand.index_finger_tip.x * frame.width,
            hand.index_finger_tip.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.index_finger_mcp.x * frame.width,
            hand.index_finger_mcp.y * frame.height,
            hand.middle_finger_mcp.x * frame.width,
            hand.middle_finger_mcp.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.middle_finger_mcp.x * frame.width,
            hand.middle_finger_mcp.y * frame.height,
            hand.middle_finger_pip.x * frame.width,
            hand.middle_finger_pip.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.middle_finger_pip.x * frame.width,
            hand.middle_finger_pip.y * frame.height,
            hand.middle_finger_dip.x * frame.width,
            hand.middle_finger_dip.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.middle_finger_dip.x * frame.width,
            hand.middle_finger_dip.y * frame.height,
            hand.middle_finger_tip.x * frame.width,
            hand.middle_finger_tip.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.middle_finger_mcp.x * frame.width,
            hand.middle_finger_mcp.y * frame.height,
            hand.ring_finger_mcp.x * frame.width,
            hand.ring_finger_mcp.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.ring_finger_mcp.x * frame.width,
            hand.ring_finger_mcp.y * frame.height,
            hand.ring_finger_pip.x * frame.width,
            hand.ring_finger_pip.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.ring_finger_pip.x * frame.width,
            hand.ring_finger_pip.y * frame.height,
            hand.ring_finger_dip.x * frame.width,
            hand.ring_finger_dip.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.ring_finger_dip.x * frame.width,
            hand.ring_finger_dip.y * frame.height,
            hand.ring_finger_tip.x * frame.width,
            hand.ring_finger_tip.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.ring_finger_mcp.x * frame.width,
            hand.ring_finger_mcp.y * frame.height,
            hand.pinky_mcp.x * frame.width,
            hand.pinky_mcp.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.pinky_mcp.x * frame.width,
            hand.pinky_mcp.y * frame.height,
            hand.pinky_pip.x * frame.width,
            hand.pinky_pip.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.pinky_pip.x * frame.width,
            hand.pinky_pip.y * frame.height,
            hand.pinky_dip.x * frame.width,
            hand.pinky_dip.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.pinky_dip.x * frame.width,
            hand.pinky_dip.y * frame.height,
            hand.pinky_tip.x * frame.width,
            hand.pinky_tip.y * frame.height,
            handPaint,
          );
          frame.drawLine(
            hand.wrist.x * frame.width,
            hand.wrist.y * frame.height,
            hand.pinky_mcp.x * frame.width,
            hand.pinky_mcp.y * frame.height,
            handPaint,
          );

          const keys = Object.keys(hand);
          for (const key of keys) {
            const point = hand[key];
            frame.drawCircle(point.x * frame.width, point.y * frame.height, dotSize - point.z * (dotSize * 2), dotPaint);
          }
        }
      }
    },
    [blurPaint, blurShaderBuilder, dotPaint, effectToUse, handPaint, invertedPaint, vhsPaint],
  );

  return (
    <View style={styles.container}>
      {device != null && (
        <PinchGestureHandler onGestureEvent={onPinchGesture} enabled={isActive}>
          <Reanimated.View style={StyleSheet.absoluteFill}>
            <TapGestureHandler onEnded={onDoubleTap} numberOfTaps={2}>
              <ReanimatedCamera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={device}
                format={format}
                fps={fps}
                hdr={enableHdr}
                lowLightBoost={device.supportsLowLightBoost && enableNightMode}
                isActive={isActive}
                onInitialized={onInitialized}
                onError={onError}
                enableZoomGesture={false}
                animatedProps={cameraAnimatedProps}
                photo={true}
                video={true}
                audio={hasMicrophonePermission}
                enableFpsGraph={true}
                previewType="skia"
                frameProcessor={device.supportsParallelVideoProcessing ? frameProcessor : undefined}
                orientation="portrait"
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
        {supportsCameraFlipping && (
          <PressableOpacity style={styles.button} onPress={onFlipCameraPressed} disabledOpacity={0.4}>
            <IonIcon name="camera-reverse" color="white" size={24} />
          </PressableOpacity>
        )}
        {supportsFlash && (
          <PressableOpacity style={styles.button} onPress={onFlashPressed} disabledOpacity={0.4}>
            <IonIcon name={flash === 'on' ? 'flash' : 'flash-off'} color="white" size={24} />
          </PressableOpacity>
        )}
        {supports60Fps && (
          <PressableOpacity style={styles.button} onPress={() => setIs60Fps(!is60Fps)}>
            <Text style={styles.text}>
              {is60Fps ? '60' : '30'}
              {'\n'}FPS
            </Text>
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
      </View>
    </View>
  );
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
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
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
});
