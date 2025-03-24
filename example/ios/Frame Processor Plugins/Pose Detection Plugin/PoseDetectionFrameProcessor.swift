//
//  PoseDetectionFrameProcessor.swift
//  VisionCameraExample
//

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
import VisionCamera
import CoreImage
import UIKit
import AVFoundation
import TensorFlowLite
import Accelerate
import Foundation

// Plugin for detecting human poses in frames using a model like LiteRT
@objc(PoseDetectionFrameProcessorPlugin)
public class PoseDetectionFrameProcessorPlugin: FrameProcessorPlugin {
    // Settings and configurations
    private var modelType: String = "thunder" // Default to Thunder (higher accuracy)
    private var drawSkeleton: Bool = true
    private var minPoseConfidence: CGFloat = 0.3
    
    // TFLite model properties
    private let modelSize = 256 // MoveNet expects 256x256 input (changed from 192)
    private var interpreter: Interpreter?
    private let modelPath = Bundle.main.path(forResource: "movenet_thunder", ofType: "tflite", inDirectory: "PoseModels")
    
    // Model input and output tensors
    private var inputTensor: Tensor?
    private var outputTensor: Tensor?
    
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
        
        // Initialize TFLite interpreter
        do {
            // Try to find the model file in different possible locations
            var modelPath: String? = nil
            let modelName = self.modelType == "lightning" ? "movenet_lightning" : "movenet_thunder"
            
            // Check in main bundle with PoseModels directory
            modelPath = Bundle.main.path(forResource: modelName, ofType: "tflite", inDirectory: "PoseModels")
            
            // If not found, check in main bundle without directory
            if modelPath == nil {
                modelPath = Bundle.main.path(forResource: modelName, ofType: "tflite")
            }
            
            // If still not found, check in RNVisionCamera bundle
            if modelPath == nil {
                if let rnVisionCameraBundle = Bundle(path: Bundle.main.bundlePath + "/RNVisionCamera") {
                    modelPath = rnVisionCameraBundle.path(forResource: modelName, ofType: "tflite", inDirectory: "PoseModels")
                }
            }
            
            guard let finalModelPath = modelPath else {
                print("[POSE PLUGIN] Failed to locate model file \(modelName).tflite")
                print("[POSE PLUGIN] Searched in PoseModels directory and main bundle")
                return
            }
            
            print("[POSE PLUGIN] Found model at: \(finalModelPath)")
            interpreter = try Interpreter(modelPath: finalModelPath)
            try interpreter?.allocateTensors()
            
            // Get input and output tensors
            guard let inputs = try interpreter?.input(at: 0),
                  let outputs = try interpreter?.output(at: 0) else {
                print("[POSE PLUGIN] Failed to get input/output tensors")
                return
            }
            
            inputTensor = inputs
            outputTensor = outputs
            
            print("[POSE PLUGIN] Model loaded successfully")
        } catch {
            print("[POSE PLUGIN] Error initializing interpreter: \(error)")
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
        
        // Check if pixel buffer is already in BGRA format
        let pixelFormat = CVPixelBufferGetPixelFormatType(pixelBuffer)
        var bgraPixelBuffer = pixelBuffer
        
        // If not in BGRA format, convert it
        if pixelFormat != kCVPixelFormatType_32BGRA {
            print("[POSE PLUGIN] Converting pixel buffer from format \(pixelFormat) to BGRA")
            
            // Create a CIImage from the original pixel buffer
            let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
            
            // Create a new pixel buffer in BGRA format
            let width = CVPixelBufferGetWidth(pixelBuffer)
            let height = CVPixelBufferGetHeight(pixelBuffer)
            var newPixelBuffer: CVPixelBuffer?
            let attributes = [kCVPixelBufferCGImageCompatibilityKey: true, kCVPixelBufferCGBitmapContextCompatibilityKey: true] as CFDictionary
            CVPixelBufferCreate(kCFAllocatorDefault, width, height, kCVPixelFormatType_32BGRA, attributes, &newPixelBuffer)
            
            guard let newBuffer = newPixelBuffer else {
                return ["error": "Failed to create BGRA pixel buffer"]
            }
            
            // Render the CIImage into the new pixel buffer
            let context = CIContext(options: nil)
            context.render(ciImage, to: newBuffer)
            
            // Use the new BGRA pixel buffer for processing
            bgraPixelBuffer = newBuffer
        }
        
        // Get frame dimensions and crop center square
        let width = CVPixelBufferGetWidth(bgraPixelBuffer)
        let height = CVPixelBufferGetHeight(bgraPixelBuffer)
        let cropSize = min(width, height)
        let cropX = (width - cropSize) / 2
        let cropY = (height - cropSize) / 2
        
        // Lock the pixel buffer to access its data
        CVPixelBufferLockBaseAddress(bgraPixelBuffer, .readOnly)
        defer {
            CVPixelBufferUnlockBaseAddress(bgraPixelBuffer, .readOnly)
        }
        
        // Get base address for cropped region
        guard let baseAddr = CVPixelBufferGetBaseAddress(bgraPixelBuffer)?
            .advanced(by: cropY * CVPixelBufferGetBytesPerRow(bgraPixelBuffer) + cropX * 4) else {
            return ["error": "Failed to get pixel buffer base address"]
        }
        
        // Set up source buffer for vImage
        var srcBuffer = vImage_Buffer(data: baseAddr,
                                    height: vImagePixelCount(cropSize),
                                    width: vImagePixelCount(cropSize),
                                    rowBytes: CVPixelBufferGetBytesPerRow(pixelBuffer))
        
        // Set up destination buffer for resizing
        let bytesPerPixel = 4
        let destRowBytes = modelSize * bytesPerPixel
        guard let destData = malloc(modelSize * modelSize * bytesPerPixel) else {
            return ["error": "Failed to allocate memory for resized image"]
        }
        defer { free(destData) }
        
        var destBuffer = vImage_Buffer(data: destData,
                                     height: vImagePixelCount(modelSize),
                                     width: vImagePixelCount(modelSize),
                                     rowBytes: destRowBytes)
        
        // Resize image to model input size
        vImageScale_ARGB8888(&srcBuffer, &destBuffer, nil, vImage_Flags(0))
        
        // Convert BGRA to RGB
        let rgbBytesPerRow = modelSize * 3
        guard let rgbData = malloc(modelSize * modelSize * 3) else {
            return ["error": "Failed to allocate memory for RGB conversion"]
        }
        defer { free(rgbData) }
        
        var rgbBuffer = vImage_Buffer(data: rgbData,
                                    height: vImagePixelCount(modelSize),
                                    width: vImagePixelCount(modelSize),
                                    rowBytes: rgbBytesPerRow)
        
        vImageConvert_BGRA8888toRGB888(&destBuffer, &rgbBuffer, UInt32(kvImageNoFlags))
        
        // The model expects input in [1, height, width, channels] format as uint8
        // For MoveNet, this is [1, 256, 256, 3] which equals 196,608 values
        
        // The model expects input in [1, height, width, channels] format as uint8
        // For MoveNet, this is [1, 256, 256, 3] which equals 196,608 values
        
        // Create input data directly from the RGB data (already in uint8 format)
        // No need to convert to float32 and normalize, as the model expects uint8 values
        let inputData = Data(bytes: rgbData, count: modelSize * modelSize * 3)
        
        // Copy input data to model's input tensor
        do {
            try interpreter?.copy(inputData, toInputAt: 0)
            
            // Run inference
            try interpreter?.invoke()
            
            // Get output tensor data
            guard let outputTensor = try? interpreter?.output(at: 0) else {
                return ["error": "Failed to get output tensor data"]
            }
            
            // Access the data property directly since it's not optional
            let outputData = outputTensor.data
            
            // Parse keypoints from output tensor
            let keypoints = outputData.withUnsafeBytes { ptr -> [(CGPoint, CGFloat)] in
                let floatPtr = ptr.bindMemory(to: Float32.self)
                var results: [(CGPoint, CGFloat)] = []
                
                // MoveNet outputs [1, 17, 3] tensor where last dim is [y, x, confidence]
                // We need to account for the batch dimension in the output
                for i in 0..<17 {
                    // Each keypoint has 3 values (y, x, confidence)
                    let offset = i * 3
                    let y = CGFloat(floatPtr[offset])
                    let x = CGFloat(floatPtr[offset + 1])
                    let confidence = CGFloat(floatPtr[offset + 2])
                    
                    // Convert normalized coordinates (0-1) to image coordinates
                    let point = CGPoint(x: x * CGFloat(width),
                                      y: y * CGFloat(height))
                    results.append((point, confidence))
                }
                return results
            }
            
            // Create a UIImage from the pixel buffer for drawing
            let ciImage = CIImage(cvPixelBuffer: bgraPixelBuffer)
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
            
            // Draw the pose skeleton if enabled
            if let context = UIGraphicsGetCurrentContext(), drawSkeleton {
                drawPoseSkeleton(context: context, keypoints: keypoints, width: width, height: height)
            }
            
            // Convert keypoints to a dictionary format that can be properly converted to JSI values
            var keypointArray: [[String: Any]] = []
            for (index, keypoint) in keypoints.enumerated() {
                let (point, confidence) = keypoint
                keypointArray.append([
                    "x": point.x,
                    "y": point.y,
                    "confidence": confidence,
                    "name": keypointNames[index]
                ])
            }
            
            return [
                "keypoints": keypointArray,
                "keypointsDetected": keypointArray.count
            ]
        } catch {
            return ["error": "Failed to process frame: \(error)"]
        }
        
        return ["error": "Failed to process frame"]
    }
    
    // Helper method to create a mock visualization for testing
    private func createMockVisualization(pixelBuffer: CVPixelBuffer) -> [String: Any] {
        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)
        
        // Create a drawing context
        UIGraphicsBeginImageContext(CGSize(width: width, height: height))
        defer {
            UIGraphicsEndImageContext()
        }
        
        // Create a UIImage from the pixel buffer for drawing
        let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
        let context = CIContext(options: nil)
        guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else {
            return ["error": "Failed to create CGImage"]
        }
        
        // Draw the original frame
        let image = UIImage(cgImage: cgImage)
        image.draw(in: CGRect(x: 0, y: 0, width: width, height: height))
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
