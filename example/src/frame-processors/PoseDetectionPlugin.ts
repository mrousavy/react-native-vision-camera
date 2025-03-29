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

// No longer need transformation metadata as it's handled in Swift

// Define the pose detection result with coordinates directly mapped to original frame
export interface PoseDetectionResult {
  keypoints: PoseKeypoint[];
  connections: PoseConnection[];
  keypointsDetected: number;
  sourceWidth: number;
  sourceHeight: number;
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
 * Maps keypoint coordinates to view coordinates based on view dimensions.
 * Coordinates from Swift are already in the original frame coordinates.
 * 
 * @param keypoint - The keypoint with coordinates mapped to the original frame
 * @param viewWidth - The width of the view where the keypoint will be drawn
 * @param viewHeight - The height of the view where the keypoint will be drawn
 * @param sourceWidth - Original frame width
 * @param sourceHeight - Original frame height
 * @param isFrontCamera - Whether front camera is being used (for mirroring)
 * @returns The screen coordinates {x, y}
 */
export function mapToViewCoordinates(
  keypoint: PoseKeypoint,
  viewWidth: number,
  viewHeight: number,
  sourceWidth: number,
  sourceHeight: number,
  isFrontCamera: boolean = false
): { x: number; y: number } {
  // STEP 1: Apply 90-degree clockwise rotation to match display orientation
  // For 90° clockwise rotation: (x, y) -> (y, width-x)
  // Note: For counter-clockwise, it would be (sourceHeight-y, x)
  const rotatedX = sourceHeight - keypoint.y;
  const rotatedY = keypoint.x;

  // STEP 2: Simple scaling from rotated dimensions to view dimensions
  // Note: After rotation, sourceWidth and sourceHeight are effectively swapped
  const scaleX = viewWidth / sourceHeight;
  const scaleY = viewHeight / sourceWidth;
  
  // STEP 3: Map coordinates from source space to view space
  let mappedX = rotatedX * scaleX;
  let mappedY = rotatedY * scaleY;
  
  // STEP 4: Apply horizontal mirroring for front camera
  if (isFrontCamera) {
    mappedX = viewWidth - mappedX; // Mirror horizontally
  }
  
  return { x: mappedX, y: mappedY };
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
    isFrontCamera
  );
  
  const to = mapToViewCoordinates(
    toKeypoint,
    viewWidth,
    viewHeight,
    sourceWidth,
    sourceHeight,
    isFrontCamera
  );
  
  return { from, to };
}