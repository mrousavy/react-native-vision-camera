import type { Frame } from 'react-native-vision-camera'
import { VisionCameraProxy } from 'react-native-vision-camera'

// Define pose detection options
export interface PoseDetectionOptions {
  modelType?: PoseModelType;
  drawSkeleton?: boolean;
  minConfidence?: number;
}

// Define the pose detection result - simplified as visualization now happens in native code
export interface PoseDetectionResult {
  modelType: string;
  keypointsDetected: number;
  drawSkeleton: boolean;
  minConfidence: number;
  frameSize: {
    width: number;
    height: number;
  };
  error?: string; // Optional error message if detection fails
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
})
console.log('[POSE PLUGIN] Plugin initialization result:', plugin ? 'Success' : 'Failed')

/**
 * Detects human poses in a video frame and renders visualization in native code
 * @param frame The camera frame to process
 * @param modelType Optional model type to use (lightning or thunder)
 * @param options Additional options like drawSkeleton and minConfidence
 * @returns Pose detection results with statistics
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
  console.log(`[POSE PLUGIN] Calling plugin with model: ${modelType}`)

  // Log frame processing
  console.log(`[PoseDetection] Processing frame: ${frame.width}x${frame.height}`)

  // Call the native plugin with the model configuration and options
  const result = plugin.call(frame, {
    modelType: modelType,
    drawSkeleton: options.drawSkeleton ?? true,
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
