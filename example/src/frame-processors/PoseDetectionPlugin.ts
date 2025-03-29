import type { Frame } from 'react-native-vision-camera'
import { VisionCameraProxy } from 'react-native-vision-camera'

// No need for global nose position as we're handling each keypoint independently
declare global {
  // Empty interface to maintain structure
}

// Define keypoint type with normalized coordinates
export type PoseKeypoint = {
  name: string;
  x: number;  // 0-1 normalized coordinates
  y: number;  // 0-1 normalized coordinates
  confidence: number;
};

// Define connection type for drawing skeleton lines
export type PoseConnection = string[];

// Define transformation metadata
export type PoseTransformation = {
  type: 'rotation' | 'scale' | 'crop';
  angle?: number;
  originalWidth: number;
  originalHeight: number;
};

// Define the pose detection result with normalized coordinates and metadata
export interface PoseDetectionResult {
  keypoints: PoseKeypoint[];
  connections: PoseConnection[];
  keypointsDetected: number;
  sourceWidth: number;
  sourceHeight: number;
  modelInputSize: number;
  transformation: PoseTransformation;
  error?: string;
}

// Define pose detection options
export interface PoseDetectionOptions {
  drawSkeleton?: boolean;
  minConfidence?: number;
}

// Model type for different accuracy/speed trade-offs
export enum PoseModelType {
  Lightning = 'lightning', // Faster detection
  Thunder = 'thunder',    // More accurate detection
}

// Initialize the plugin with default configuration
console.log('[POSE PLUGIN] Initializing pose_detection_plugin in TypeScript')
const plugin = VisionCameraProxy.initFrameProcessorPlugin('pose_detection_plugin', {
  modelType: PoseModelType.Thunder,
  drawSkeleton: false,
  minConfidence: 0.3
})
console.log('[POSE PLUGIN] Plugin initialization result:', plugin ? 'Success' : 'Failed')

/**
 * Detects human poses in a video frame and returns normalized coordinates 
 * with metadata for JavaScript rendering
 * 
 * @param frame The camera frame to process
 * @param modelType Optional model type to use (lightning or thunder)
 * @param options Additional options like drawSkeleton and minConfidence
 * @returns Pose detection results with normalized coordinates and metadata
 */
export function detectPose(
  frame: Frame,
  modelType: PoseModelType = PoseModelType.Thunder,
  options: Partial<PoseDetectionOptions> = {}
): PoseDetectionResult {
  'worklet'

  if (plugin == null) {
    console.log('[POSE PLUGIN] Plugin not found!')
    throw new Error('Failed to load Frame Processor Plugin "pose_detection_plugin"!')
  }
  
  // Log frame processing
  console.log(`[PoseDetection] Processing frame: ${frame.width}x${frame.height}`)

  // Call the native plugin with the model configuration and options
  const result = plugin.call(frame, {
    modelType: modelType,
    drawSkeleton: false, // Set to false since we'll draw in JS
    minConfidence: options.minConfidence ?? 0.3
  }) as unknown as PoseDetectionResult

  // Check for errors
  if (result.error) {
    console.log(`[PoseDetection] Error: ${result.error}`)
  } else if (result.keypointsDetected > 0) {
    console.log(`[PoseDetection] Detected pose with ${result.keypointsDetected} keypoints`)
  } else {
    console.log(`[PoseDetection] No pose detected`)
  }

  return result
}

/**
 * Maps normalized keypoint coordinates to screen coordinates based on the view dimensions
 * and device orientation.
 * 
 * @param keypoint - The normalized keypoint (0-1 range)
 * @param viewWidth - The width of the view where the keypoint will be drawn
 * @param viewHeight - The height of the view where the keypoint will be drawn
 * @param transformation - The transformation applied during processing
 * @returns The screen coordinates {x, y}
 */
export function mapToViewCoordinates(
  keypoint: PoseKeypoint,
  viewWidth: number,
  viewHeight: number,
  sourceWidth: number,
  sourceHeight: number,
  transformation: PoseTransformation,
  modelInputSize: number,
  isFrontCamera: boolean = false
): { x: number; y: number } {
  console.log(`[PoseMapping] Input coordinates - x: ${keypoint.x}, y: ${keypoint.y}`);
  console.log(`[PoseMapping] viewWidth: ${viewWidth}, viewHeight: ${viewHeight}, sourceWidth: ${sourceWidth}, sourceHeight: ${sourceHeight}`);
  console.log(`[PoseMapping] Transformation - type: ${transformation.type}, angle: ${transformation.angle}`);
  console.log(`[PoseMapping] Model input size: ${modelInputSize}`);

  // For 90-degree rotation, we need to handle the coordinate system differently
  // based on observation, the model would return the value in the right location, no need to rotate again. so, reverse the isRotated flag
  const isRotated = !(transformation.type === 'rotation' && transformation.angle === 90);
  console.log(`[PoseMapping] isRotated: ${isRotated}`);
  console.log(`[PoseMapping] isFrontCamera: ${isFrontCamera}`);
  // First normalize coordinates from model space to source space
  const normalizedX = keypoint.x * modelInputSize;
  const normalizedY = keypoint.y * modelInputSize;

  // Swap dimensions for rotated frame
  //since we reversed the isRotated flag, we need to swap the width and height for rotated frame
  const effectiveSourceWidth = isRotated ? sourceHeight : sourceWidth;
  const effectiveSourceHeight = isRotated ? sourceWidth : sourceHeight;

  // Calculate the scaling factors for both dimensions
  const scaleX = viewWidth / effectiveSourceWidth;
  const scaleY = viewHeight / effectiveSourceHeight;
  
  // Use separate scales for X and Y to fix the coordinate mapping issue
  // This ensures landmarks maintain proper positioning regardless of where they appear in the frame
  const scaleToUseX = scaleX;
  
  // FIXED: Adjust Y-scale to account for center crop operation
  // The model processes a center-cropped square from the original frame
  // We need to adjust the Y-scale to map back to the original aspect ratio
  const cropSize = Math.min(effectiveSourceWidth, effectiveSourceHeight);
  const cropY = (effectiveSourceHeight - cropSize) / 2;
  const scaleToUseY = viewHeight / cropSize;
  
  // Calculate centering offsets using separate scales for X and Y
  const offsetX = (viewWidth - effectiveSourceWidth * scaleToUseX) / 2;
  const offsetY = (viewHeight - cropSize * scaleToUseY) / 2;

  console.log(`[PoseMapping] Normalized coordinates - x: ${normalizedX}, y: ${normalizedY}`);
  console.log(`[PoseMapping] Scale factors - scaleX: ${scaleX}, scaleY: ${scaleY}, using scaleToUseX: ${scaleToUseX}, scaleToUseY: ${scaleToUseY}`);
  console.log(`[PoseMapping] Offsets - offsetX: ${offsetX}, offsetY: ${offsetY}`);

  // Apply clockwise rotation for 90-degree rotated frame and handle front camera mirroring
  let mappedX, mappedY;
  if (isRotated) {
    // For 90-degree clockwise rotation
    if (isFrontCamera) {
      // For front camera, we need to handle both rotation and mirroring
      // The front camera is mirrored horizontally, so we need to flip the X coordinate
      // For 90-degree clockwise rotation: x becomes y, y becomes (1-x)
      // Standard mapping for all keypoints - no special handling for eyes based on nose position
      mappedX = offsetX + (normalizedY / modelInputSize) * sourceHeight * scaleToUseX;
      mappedY = offsetY + (1.0 - normalizedX / modelInputSize) * sourceWidth * scaleToUseY;
    } else {
      // For back camera, just handle rotation
      mappedX = offsetX + normalizedY / modelInputSize * sourceHeight * scaleToUseX;
      mappedY = offsetY + (1.0 - normalizedX / modelInputSize) * sourceWidth * scaleToUseY;
    }
  } else {
    // No rotation, map coordinates directly
    if (isFrontCamera) {
      // For front camera without rotation, just mirror horizontally
      mappedX = offsetX + (1.0 - normalizedX / modelInputSize) * sourceWidth * scaleToUseX;
      mappedY = offsetY + normalizedY / modelInputSize * sourceHeight * scaleToUseY;
    } else {
      // No mirroring for back camera
      mappedX = offsetX + normalizedX / modelInputSize * sourceWidth * scaleToUseX;
      mappedY = offsetY + normalizedY / modelInputSize * sourceHeight * scaleToUseY;
    }
  }

  const mappedCoords = { x: mappedX, y: mappedY };
  console.log(`[PoseMapping] Mapped coordinates - x: ${mappedCoords.x}, y: ${mappedCoords.y}`);

  return mappedCoords;
}

/**
 * Get the connection keypoints based on the connection definition
 */
export function getConnectionPoints(
  keypoints: PoseKeypoint[],
  connection: PoseConnection,
  viewWidth: number,
  viewHeight: number,
  sourceWidth: number,
  sourceHeight: number,
  transformation: PoseTransformation,
  modelInputSize: number,
  isFrontCamera: boolean = false
): { from: { x: number; y: number }; to: { x: number; y: number } } | null {
  // Find the keypoints for the connection
  const fromKeypoint = keypoints.find(kp => kp.name === connection[0]);
  const toKeypoint = keypoints.find(kp => kp.name === connection[1]);
  
  // If either keypoint is missing, return null
  if (!fromKeypoint || !toKeypoint) {
    return null;
  }
  
  // Only draw connections if at least one keypoint has good confidence
  if (fromKeypoint.confidence < 0.1 || toKeypoint.confidence < 0.1) {
    return null;
  }
  
  // Map keypoints to view coordinates
  const from = mapToViewCoordinates(
    fromKeypoint,
    viewWidth,
    viewHeight,
    sourceWidth,
    sourceHeight,
    transformation,
    modelInputSize,
    isFrontCamera
  );
  
  const to = mapToViewCoordinates(
    toKeypoint,
    viewWidth,
    viewHeight,
    sourceWidth,
    sourceHeight,
    transformation,
    modelInputSize,
    isFrontCamera
  );
  
  return { from, to };
}