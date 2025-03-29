<div>
  <img align="right" width="35%" src="../../docs/static/img/example.png">

  <h1>Vision Camera playground</h1>

  <h2>Overview</h2>

  <p align="left">
  This is a demo application featuring some of the many features of the Vision Camera:

  * Photo capture
  * Video capture
  * Flipping device (back camera <-> front camera)
  * Device filtering (ultra-wide-angle, wide-angle, telephoto, or even combined virtual multi-cameras)
  * Format filtering (targeting 60 FPS, best capture size, best matching aspect ratio, etc.)
  * Zooming using [react-native-gesture-handler](https://github.com/software-mansion/react-native-gesture-handler) and [react-native-reanimated](https://github.com/software-mansion/react-native-reanimated)
  * Smoothly switching between constituent camera devices (see [demo on my Twitter](https://twitter.com/mrousavy/status/1365267563375116292))
  * HDR mode
  * Night mode
  * Flash for photo capture
  * Flash for video capture
  * Activating/Pausing the Camera but keeping it "warm"
  * Using the Example Frame Processor Plugin
  * Pose Detection with TensorFlow Lite and MoveNet
  </p>
</div>

## Get started

To try the playground out for yourself, run the following commands:

```sh
git clone https://github.com/mrousavy/react-native-vision-camera
cd react-native-vision-camera/package
bun bootstrap
```

### iOS

1. Open the `example/ios/VisionCameraExample.xcworkspace` file with Xcode
2. Change signing configuration to your developer account
3. Select your device in the devices drop-down
4. Hit run

### Android

1. Open the `example/android/` folder with Android Studio
2. Select your device in the devices drop-down
3. Hit run

## Pose Detection Implementation

The example app includes a human pose detection feature that demonstrates how to use Frame Processors with machine learning models. This implementation uses TensorFlow Lite with the MoveNet model to detect human poses in real-time.

### Architecture Overview

The pose detection implementation follows a plugin architecture with two main components:

1. **Native Swift Plugin**: Handles frame processing, model inference, and coordinate mapping
2. **React Native Component**: Renders the detected pose skeleton overlay

### Swift Implementation (iOS)

The Swift implementation is structured as a Frame Processor Plugin that processes each camera frame:

#### Plugin Structure

- **PoseDetectionFrameProcessor.swift**: Main implementation of the frame processor
- **PoseDetectionFrameProcessor.m**: Objective-C bridge for registering the plugin

#### Key Components

1. **Model Loading**: Loads the MoveNet TensorFlow Lite model (either "thunder" or "lightning" variant)
2. **Frame Preprocessing**:
   - Rotates and crops the input frame to match model requirements
   - Resizes the image to 256x256 pixels (model input size)
   - Converts RGBA to RGB format
3. **Model Inference**:
   - Runs the TensorFlow Lite model on the preprocessed frame
   - Extracts keypoint coordinates and confidence scores
4. **Coordinate Transformation**:
   - Transforms normalized model coordinates (0-1) to original frame coordinates
   - Handles rotation, scaling, and cropping transformations
   - Accounts for device orientation and camera mirroring

#### Keypoints and Connections

The model detects 17 keypoints representing body parts (nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles) and defines connections between them to form a skeleton.

### TypeScript Implementation (React Native)

The React Native side renders the detected pose skeleton on top of the camera preview:

#### Component Structure

- **PoseSkeletonOverlay.tsx**: React component that renders SVG elements for the skeleton
- **PoseDetectionPlugin.ts**: TypeScript interface for the native plugin

#### Key Features

1. **Skeleton Rendering**:
   - Renders lines between connected keypoints
   - Renders circles at keypoint positions
   - Filters keypoints based on confidence threshold
2. **Coordinate Mapping**:
   - Maps coordinates from camera space to view space
   - Handles mirroring for front camera
3. **Customization**:
   - Configurable colors, line widths, and point sizes
   - Adjustable confidence threshold

### Coordinate Transformation Challenges

One of the main challenges in the implementation is correctly mapping coordinates between different spaces:

1. **Model Space**: Normalized coordinates (0-1) from the ML model
2. **Camera Space**: Original camera frame coordinates
3. **View Space**: Coordinates in the React Native view

Additional complexities include:

- **Rotation**: Camera frames may be rotated 90° from the display orientation
- **Mirroring**: Front camera requires horizontal flipping
- **Aspect Ratio**: Handling different aspect ratios between camera and display

### Usage

The pose detection can be enabled in the camera view with configuration options:

```jsx
<Camera
  style={styles.camera}
  device={device}
  isActive={isActive}
  frameProcessor={frameProcessor}
  frameProcessorFps={5}
>
  <PoseSkeletonOverlay 
    poseData={poseData} 
    mirrored={isFrontCamera} 
    confidenceThreshold={0.3} 
  />
</Camera>
```

The frame processor can be configured with:

```javascript
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  const poses = pose_detection_plugin(frame, {
    modelType: 'thunder', // or 'lightning'
    minConfidence: 0.3,
    drawSkeleton: true
  });
  runOnJS(setPoseData)(poses);
}, []);
```
