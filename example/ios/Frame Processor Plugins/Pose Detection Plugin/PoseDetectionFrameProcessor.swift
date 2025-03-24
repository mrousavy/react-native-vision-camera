//
//  PoseDetectionFrameProcessor.swift
//  VisionCameraExample
//

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
import VisionCamera
import CoreImage
import UIKit
import AVFoundation
// Import LiteRT when available - for now we'll mock the pose detector
// import LiteRT

// Plugin for detecting human poses in frames using a model like LiteRT
@objc(PoseDetectionFrameProcessorPlugin)
public class PoseDetectionFrameProcessorPlugin: FrameProcessorPlugin {
    // Settings and configurations
    private var modelType: String = "thunder" // Default to Thunder (higher accuracy)
    private var drawSkeleton: Bool = true
    private var minPoseConfidence: CGFloat = 0.3
    
    public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
        super.init(proxy: proxy, options: options)
        configure(options: options)
        print("[POSE PLUGIN] PoseDetectionFrameProcessorPlugin initialized with options: \(String(describing: options))")
        print("[POSE PLUGIN] Plugin name should be 'pose_detection_plugin'")
    }
    
    // Configure colors for visualization
    private let lineColor = UIColor(red: 0, green: 1, blue: 0, alpha: 0.8)
    private let jointColor = UIColor(red: 1, green: 0, blue: 0, alpha: 0.8)
    
    // Line width for skeleton lines
    private let lineWidth: CGFloat = 3.0
    private let jointRadius: CGFloat = 4.0
    
    // Keypoint indices for drawing connections
    private let connections: [(Int, Int)] = [
        (0, 1),   // nose to left_eye
        (0, 2),   // nose to right_eye
        (1, 3),   // left_eye to left_ear
        (2, 4),   // right_eye to right_ear
        (0, 5),   // nose to left_shoulder
        (0, 6),   // nose to right_shoulder
        (5, 7),   // left_shoulder to left_elbow
        (7, 9),   // left_elbow to left_wrist
        (6, 8),   // right_shoulder to right_elbow
        (8, 10),  // right_elbow to right_wrist
        (5, 6),   // left_shoulder to right_shoulder
        (5, 11),  // left_shoulder to left_hip
        (6, 12),  // right_shoulder to right_hip
        (11, 12), // left_hip to right_hip
        (11, 13), // left_hip to left_knee
        (13, 15), // left_knee to left_ankle
        (12, 14), // right_hip to right_knee
        (14, 16)  // right_knee to right_ankle
    ]
    
    // Keypoint names - useful for debugging
    private let keypointNames = [
        "nose",
        "left_eye",
        "right_eye",
        "left_ear",
        "right_ear",
        "left_shoulder",
        "right_shoulder",
        "left_elbow",
        "right_elbow",
        "left_wrist",
        "right_wrist",
        "left_hip",
        "right_hip",
        "left_knee",
        "right_knee",
        "left_ankle",
        "right_ankle"
    ]
    
    // Removed duplicate init method
    
    private func configure(options: [AnyHashable: Any]! = [:]) {
        // Configure options from the JS side
        if let modelTypeStr = options["modelType"] as? String {
            self.modelType = modelTypeStr
        }
        
        if let drawSkeletonOption = options["drawSkeleton"] as? Bool {
            self.drawSkeleton = drawSkeletonOption
        }
        
        if let minConfidence = options["minConfidence"] as? CGFloat {
            self.minPoseConfidence = minConfidence
        }
    }
    
    // Required callback method for frame processor plugins
    @objc public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
        print("[POSE PLUGIN] Callback method called with arguments: \(String(describing: arguments))")
        // Update configuration if needed
        if let args = arguments {
            if let modelTypeStr = args["modelType"] as? String {
                self.modelType = modelTypeStr
            }
            
            if let drawSkeletonOption = args["drawSkeleton"] as? Bool {
                self.drawSkeleton = drawSkeletonOption
            }
            
            if let minConfidence = args["minConfidence"] as? CGFloat {
                self.minPoseConfidence = minConfidence
            }
        }
        
        // Get the image buffer from the frame
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else {
            return ["error": "Failed to get image buffer from frame"]
        }
        
        // Lock the pixel buffer to access its data
        CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
        defer {
            // Make sure we unlock the buffer when done
            CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
        }
        
        // Get frame dimensions
        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)
        
        // Create a UIImage from the pixel buffer for drawing
        let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
        let context = CIContext(options: nil)
        guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else {
            return ["error": "Failed to create CGImage"]
        }
        
        // Create a drawing context
        UIGraphicsBeginImageContext(CGSize(width: width, height: height))
        defer {
            UIGraphicsEndImageContext()
        }
        
        // Draw the original frame
        let image = UIImage(cgImage: cgImage)
        image.draw(in: CGRect(x: 0, y: 0, width: width, height: height))
        
        // TEMP: For testing - this is where we'd call the pose detector in production
        // In a real implementation, we would use the LiteRT model to detect poses
        // For now, we'll simulate detected poses with mock data
        let mockPoseKeypoints = getMockPoseKeypoints(width: width, height: height)
        
        // Get the graphics context for drawing
        if let context = UIGraphicsGetCurrentContext(), drawSkeleton {
            // Draw the pose skeleton
            drawPoseSkeleton(context: context, keypoints: mockPoseKeypoints, width: width, height: height)
        }
        
        // Get the final image with overlay
        guard let overlaidImage = UIGraphicsGetImageFromCurrentImageContext(),
              let overlaidCGImage = overlaidImage.cgImage else {
            return ["error": "Failed to create final image"]
        }
        
        // Create a new pixel buffer with the processed image
        // In a real implementation, we would return the processed frame with the pose overlay
        // For the prototype, we'll just return some statistics
        
        // In production, we would modify the pixel buffer or return a new one
        // For now, we'll just return stats about what we detected
        return [
            "modelType": modelType,
            "keypointsDetected": mockPoseKeypoints.count,
            "drawSkeleton": drawSkeleton,
            "minConfidence": minPoseConfidence,
            "frameSize": [
                "width": width,
                "height": height
            ]
        ]
    }
    
    // TEMPORARY: Mock keypoints for testing
    private func getMockPoseKeypoints(width: Int, height: Int) -> [(CGPoint, CGFloat)] {
        // Create some mock keypoints for a standing pose
        // Format: (position, confidence)
        let centerX = CGFloat(width) / 2.0
        let headY = CGFloat(height) * 0.2
        let shoulderY = CGFloat(height) * 0.3
        let hipY = CGFloat(height) * 0.5
        let kneeY = CGFloat(height) * 0.7
        let ankleY = CGFloat(height) * 0.9
        
        return [
            (CGPoint(x: centerX, y: headY), 0.95),                 // 0: nose
            (CGPoint(x: centerX - 20, y: headY - 10), 0.9),         // 1: left eye
            (CGPoint(x: centerX + 20, y: headY - 10), 0.9),         // 2: right eye
            (CGPoint(x: centerX - 35, y: headY), 0.8),              // 3: left ear
            (CGPoint(x: centerX + 35, y: headY), 0.8),              // 4: right ear
            (CGPoint(x: centerX - 50, y: shoulderY), 0.95),         // 5: left shoulder
            (CGPoint(x: centerX + 50, y: shoulderY), 0.95),         // 6: right shoulder
            (CGPoint(x: centerX - 70, y: shoulderY + 60), 0.9),     // 7: left elbow
            (CGPoint(x: centerX + 70, y: shoulderY + 60), 0.9),     // 8: right elbow
            (CGPoint(x: centerX - 60, y: shoulderY + 120), 0.85),   // 9: left wrist
            (CGPoint(x: centerX + 60, y: shoulderY + 120), 0.85),   // 10: right wrist
            (CGPoint(x: centerX - 40, y: hipY), 0.9),               // 11: left hip
            (CGPoint(x: centerX + 40, y: hipY), 0.9),               // 12: right hip
            (CGPoint(x: centerX - 45, y: kneeY), 0.85),             // 13: left knee
            (CGPoint(x: centerX + 45, y: kneeY), 0.85),             // 14: right knee
            (CGPoint(x: centerX - 50, y: ankleY), 0.8),             // 15: left ankle
            (CGPoint(x: centerX + 50, y: ankleY), 0.8)              // 16: right ankle
        ]
    }
    
    // Draw the pose skeleton on the context
    private func drawPoseSkeleton(context: CGContext, keypoints: [(CGPoint, CGFloat)], width: Int, height: Int) {
        // Set line style for connections
        context.setStrokeColor(lineColor.cgColor)
        context.setLineWidth(lineWidth)
        context.setLineCap(.round)
        
        // Draw connections (skeleton lines)
        for connection in connections {
            let from = connection.0
            let to = connection.1
            
            guard from < keypoints.count && to < keypoints.count else { continue }
            
            let fromPoint = keypoints[from]
            let toPoint = keypoints[to]
            
            // Only draw if both points have sufficient confidence
            if fromPoint.1 >= minPoseConfidence && toPoint.1 >= minPoseConfidence {
                context.move(to: fromPoint.0)
                context.addLine(to: toPoint.0)
                context.strokePath()
            }
        }
        
        // Set style for keypoints
        context.setFillColor(jointColor.cgColor)
        
        // Draw keypoints
        for (point, confidence) in keypoints {
            if confidence >= minPoseConfidence {
                let rect = CGRect(x: point.x - jointRadius, y: point.y - jointRadius, 
                                  width: jointRadius * 2, height: jointRadius * 2)
                context.fillEllipse(in: rect)
            }
        }
    }
}
#endif
