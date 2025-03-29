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

// Plugin for detecting human poses in frames using a model like MoveNet
@objc(PoseDetectionFrameProcessorPlugin)
public class PoseDetectionFrameProcessorPlugin: FrameProcessorPlugin {
    // Settings and configurations
    private var modelType: String = "thunder" // Default to Thunder (higher accuracy)
    private var drawSkeleton: Bool = true
    private var minPoseConfidence: CGFloat = 0.1 // Reduced threshold for testing
    
    // TFLite model properties
    private let modelSize = 256 // MoveNet expects 256x256 input
    private var interpreter: Interpreter?
    
    // Model input and output tensors
    private var inputTensor: Tensor?
    private var outputTensor: Tensor?
    
    // Debugging flags
    private let enableDebugLogging = true
    private var frameCount = 0
    private let logEveryNFrames = 10
    
    public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
        super.init(proxy: proxy, options: options)
        configure(options: options)
        debugLog("PoseDetectionFrameProcessorPlugin initialized with options: \(String(describing: options))")
    }
    
    // Keypoint names for debugging and results
    private let keypointNames = [
        "nose", "left_eye", "right_eye", "left_ear", "right_ear",
        "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
        "left_wrist", "right_wrist", "left_hip", "right_hip",
        "left_knee", "right_knee", "left_ankle", "right_ankle"
    ]
    
    // Define the skeleton connections for drawing
    private let skeletonConnections = [
        // Face
        ["nose", "left_eye"], ["nose", "right_eye"], 
        ["left_eye", "left_ear"], ["right_eye", "right_ear"],
        // Upper body
        ["left_shoulder", "right_shoulder"], ["left_shoulder", "left_elbow"], 
        ["right_shoulder", "right_elbow"], ["left_elbow", "left_wrist"], 
        ["right_elbow", "right_wrist"],
        // Torso
        ["left_shoulder", "left_hip"], ["right_shoulder", "right_hip"], 
        ["left_hip", "right_hip"],
        // Lower body
        ["left_hip", "left_knee"], ["right_hip", "right_knee"], 
        ["left_knee", "left_ankle"], ["right_knee", "right_ankle"]
    ]
    
    // Helper for controlled debug logging
    private func debugLog(_ message: String) {
        if enableDebugLogging {
            print("[POSE PLUGIN] \(message)")
        }
    }
    
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
            // Find the model file
            var possibleLocations: [String?] = []
            
            let modelName = self.modelType == "lightning" ? "movenet_lightning" : "movenet_thunder"
            
            // Check main bundle with PoseModels directory
            possibleLocations.append(Bundle.main.path(forResource: modelName, ofType: "tflite", inDirectory: "PoseModels"))
            
            // Check main bundle without directory
            possibleLocations.append(Bundle.main.path(forResource: modelName, ofType: "tflite"))
            
            // Check RNVisionCamera bundle
            if let rnVisionCameraBundle = Bundle(path: Bundle.main.bundlePath + "/RNVisionCamera") {
                possibleLocations.append(rnVisionCameraBundle.path(forResource: modelName, ofType: "tflite", inDirectory: "PoseModels"))
            }
            
            // Find first valid path
            var finalModelPath: String? = nil
            for location in possibleLocations {
                if let path = location {
                    finalModelPath = path
                    break
                }
            }
            
            guard let modelPath = finalModelPath else {
                debugLog("ERROR: Failed to locate model file \(modelName).tflite")
                return
            }
            
            debugLog("Found model at: \(modelPath)")
            interpreter = try Interpreter(modelPath: modelPath)
            
            // Allocate memory for model tensors
            try interpreter?.allocateTensors()
            
            // Get input and output tensors
            guard let inputs = try interpreter?.input(at: 0),
                  let outputs = try interpreter?.output(at: 0) else {
                debugLog("ERROR: Failed to get input/output tensors")
                return
            }
            
            inputTensor = inputs
            outputTensor = outputs
            
            // Log tensor details for debugging
            if let inputTensor = inputTensor {
                debugLog("Input tensor shape: \(inputTensor.shape), type: \(inputTensor.dataType)")
            }
            
            debugLog("Model loaded successfully")
        } catch {
            debugLog("ERROR: Initializing interpreter failed: \(error)")
        }
    }
    
    // Required callback method for frame processor plugins
    @objc public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
        // Increment frame counter for throttled logging
        frameCount += 1
        let shouldLog = frameCount % logEveryNFrames == 0
        
        if shouldLog {
            debugLog("Processing frame \(frameCount)")
        }
        
        // Update configuration if needed
        if let args = arguments {
            if let modelTypeStr = args["modelType"] as? String, modelTypeStr != self.modelType {
                self.modelType = modelTypeStr
                configure(options: args)
            }
            
            if let drawSkeletonOption = args["drawSkeleton"] as? Bool {
                self.drawSkeleton = drawSkeletonOption
            }
            
            if let minConfidence = args["minConfidence"] as? CGFloat {
                self.minPoseConfidence = minConfidence
            }
        }
        
        // Check if interpreter is available
        guard let interpreter = interpreter else {
            debugLog("ERROR: TFLite interpreter not initialized")
            return ["error": "TFLite interpreter not initialized"]
        }
        
        // Get the image buffer from the frame
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else {
            debugLog("ERROR: Failed to get image buffer from frame")
            return ["error": "Failed to get image buffer from frame"]
        }
        
        // Get frame dimensions
        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)
        
        if shouldLog {
            debugLog("Frame dimensions: \(width)x\(height)")
        }
        
        do {
            // 1. Preprocess the image - with rotation fix
            let inputData = try preprocessImageWithRotation(pixelBuffer)
            
            // 2. Run inference
            try interpreter.copy(inputData, toInputAt: 0)
            try interpreter.invoke()
            
            // 3. Get output tensor
            let outputTensor = try interpreter.output(at: 0)
            
            // 4. Process results to get normalized coordinates
            let normalizedKeypoints = processOutputTensorNormalized(outputTensor.data)
            
            // 5. Transform normalized coordinates to original frame coordinates
            let transformedKeypoints = transformKeypointsToOriginalFrame(
                normalizedKeypoints: normalizedKeypoints,
                imageWidth: width,
                imageHeight: height,
                modelSize: modelSize
            )
            
            // 6. Log results if needed
            if shouldLog {
                debugLog("Detected \(transformedKeypoints.count) keypoints")
                for keypoint in transformedKeypoints.prefix(3) {
                    if let name = keypoint["name"] as? String,
                       let confidence = keypoint["confidence"] as? CGFloat {
                        debugLog(" - \(name): confidence \(confidence)")
                    }
                }
            }
            
            // 7. Return results with transformed coordinates
            return [
                "keypoints": transformedKeypoints,
                "connections": skeletonConnections,
                "keypointsDetected": transformedKeypoints.count,
                "sourceWidth": width,
                "sourceHeight": height
            ]
            
        } catch {
            debugLog("ERROR: Failed to process frame: \(error)")
            return ["error": "Failed to process frame: \(error.localizedDescription)"]
        }
    }
    
    // MARK: - Image Preprocessing with Rotation Fix
    
    private func preprocessImageWithRotation(_ pixelBuffer: CVPixelBuffer) throws -> Data {
        // Create CIImage from pixel buffer
        let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
        
        // *** ROTATION FIX ***
        // Apply 90-degree rotation clockwise to fix the orientation
        // Based on the debug images showing 90-degree rotation to the left
        let rotatedImage = ciImage.oriented(.right)
        
        // Determine crop area (center square)
        let rotatedWidth = rotatedImage.extent.width
        let rotatedHeight = rotatedImage.extent.height
        let cropSize = min(rotatedWidth, rotatedHeight)
        let cropX = (rotatedWidth - cropSize) / 2
        let cropY = (rotatedHeight - cropSize) / 2
        
        // Crop the rotated image to a square
        let cropRect = CGRect(x: cropX, y: cropY, width: cropSize, height: cropSize)
        let croppedImage = rotatedImage.cropped(to: cropRect)
        
        // Scale the cropped image to the model input size
        let scaleX = CGFloat(modelSize) / cropSize
        let scaleY = CGFloat(modelSize) / cropSize
        let scaledImage = croppedImage.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))
        
        // Create a target context
        let context = CIContext(options: nil)
        
        // Create a CGImage from the scaled image
        guard let cgImage = context.createCGImage(scaledImage, from: scaledImage.extent) else {
            throw NSError(domain: "PoseDetection", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to create CGImage from scaled image"])
        }
        
        // Create RGB bitmap at target size (modelSize x modelSize)
        let rgbColorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue)
        let bitmapBytesPerRow = modelSize * 4 // 4 bytes per pixel (RGBA)
        
        guard let bitmapContext = CGContext(
            data: nil,
            width: modelSize,
            height: modelSize,
            bitsPerComponent: 8,
            bytesPerRow: bitmapBytesPerRow,
            space: rgbColorSpace,
            bitmapInfo: bitmapInfo.rawValue
        ) else {
            throw NSError(domain: "PoseDetection", code: 2, userInfo: [NSLocalizedDescriptionKey: "Failed to create bitmap context"])
        }
        
        // Draw the scaled image into the bitmap context
        bitmapContext.draw(cgImage, in: CGRect(x: 0, y: 0, width: modelSize, height: modelSize))
        
        // Get access to the bitmap data
        guard let bitmapData = bitmapContext.data else {
            throw NSError(domain: "PoseDetection", code: 3, userInfo: [NSLocalizedDescriptionKey: "Failed to access bitmap data"])
        }
        
        // Convert RGBA to RGB since the model expects RGB inputs
        let rgbData = UnsafeMutablePointer<UInt8>.allocate(capacity: modelSize * modelSize * 3)
        defer {
            rgbData.deallocate()
        }
        
        let bitmapDataPtr = bitmapData.bindMemory(to: UInt8.self, capacity: modelSize * modelSize * 4)
        
        // Copy RGB data (skipping alpha)
        for y in 0..<modelSize {
            for x in 0..<modelSize {
                let sourceOffset = y * bitmapBytesPerRow + x * 4
                let destOffset = (y * modelSize + x) * 3
                
                // Copy RGB values (skip alpha)
                rgbData[destOffset] = bitmapDataPtr[sourceOffset]       // R
                rgbData[destOffset + 1] = bitmapDataPtr[sourceOffset + 1] // G
                rgbData[destOffset + 2] = bitmapDataPtr[sourceOffset + 2] // B
            }
        }
        
        // Create Data object from the RGB buffer
        let inputData = Data(bytes: rgbData, count: modelSize * modelSize * 3)
        
        // Save input image to photos (for debugging)
        if frameCount <= 3 {
            saveImageToPhotos(bitmapContext, label: "Rotated Input \(frameCount)")
        }
        
        return inputData
    }
    
    // MARK: - Output Processing
    
    // Process the output tensor and return normalized coordinates (0-1)
    private func processOutputTensorNormalized(_ outputData: Data) -> [[String: Any]] {
        return outputData.withUnsafeBytes { ptr -> [[String: Any]] in
            let floatPtr = ptr.bindMemory(to: Float32.self)
            var keypointsArray: [[String: Any]] = []
            
            // Process each of the 17 keypoints
            for i in 0..<17 {
                // Each keypoint has 3 values (y, x, confidence)
                let offset = i * 3
                let y = CGFloat(floatPtr[offset])      // Already normalized y-coordinate [0,1]
                let x = CGFloat(floatPtr[offset + 1])  // Already normalized x-coordinate [0,1]
                let confidence = CGFloat(floatPtr[offset + 2])
                
                // Add the keypoint to our results with normalized coordinates
                keypointsArray.append([
                    "name": self.keypointNames[i],
                    "x": x,
                    "y": y,
                    "confidence": confidence
                ])
            }
            
            return keypointsArray
        }
    }
    
    // Transform normalized keypoints to original frame coordinates
    private func transformKeypointsToOriginalFrame(
        normalizedKeypoints: [[String: Any]],
        imageWidth: Int,
        imageHeight: Int,
        modelSize: Int
    ) -> [[String: Any]] {
        // Calculate crop region properties (from preprocessImageWithRotation)
        let originalWidth = CGFloat(imageWidth)
        let originalHeight = CGFloat(imageHeight)
        
        // The original image is rotated 90° clockwise
        // So the width becomes height and vice versa
        let rotatedWidth = originalHeight
        let rotatedHeight = originalWidth
        
        // Calculate crop dimensions (center square)
        let cropSize = min(rotatedWidth, rotatedHeight)
        let cropX = (rotatedWidth - cropSize) / 2
        let cropY = (rotatedHeight - cropSize) / 2
        
        // Calculate scaling ratios
        let widthRatio = cropSize / CGFloat(modelSize)
        let heightRatio = cropSize / CGFloat(modelSize)
        
        // Create transformed keypoints array
        var transformedKeypoints: [[String: Any]] = []
        
        for keypoint in normalizedKeypoints {
            guard let name = keypoint["name"] as? String,
                  let normalizedX = keypoint["x"] as? CGFloat,
                  let normalizedY = keypoint["y"] as? CGFloat,
                  let confidence = keypoint["confidence"] as? CGFloat else {
                continue
            }
            
            // Step 1: Scale normalized coordinates [0,1] to model input size
            let modelX = normalizedX * CGFloat(modelSize)
            let modelY = normalizedY * CGFloat(modelSize)
            
            // Step 2: Scale to crop size and add crop offset
            let cropX = (modelX * widthRatio) + cropX
            let cropY = (modelY * heightRatio) + cropY
            
            // Step 3: De-rotate coordinates (90° counter-clockwise)
            // x' = y, y' = width - x for 90° clockwise rotation reversal
            let derotatedX = cropY
            let derotatedY = rotatedWidth - cropX
            
            // Add the transformed keypoint to our results
            transformedKeypoints.append([
                "name": name,
                "x": derotatedX,
                "y": derotatedY,
                "confidence": confidence
            ])
        }
        
        return transformedKeypoints
    }
    
    // MARK: - Debugging Helpers
    
    private func saveImageToPhotos(_ context: CGContext, label: String) {
        // Get image from context
        guard let cgImage = context.makeImage() else {
            debugLog("Failed to create image from context")
            return
        }
        
        // Create UIImage
        let uiImage = UIImage(cgImage: cgImage)
        
        // Add a label to the image
        UIGraphicsBeginImageContextWithOptions(uiImage.size, false, 1.0)
        defer { UIGraphicsEndImageContext() }
        
        // Draw original image
        uiImage.draw(in: CGRect(origin: .zero, size: uiImage.size))
        
        // Draw text
        let text = label
        let textAttributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.boldSystemFont(ofSize: 16),
            .foregroundColor: UIColor.white,
            .backgroundColor: UIColor.black.withAlphaComponent(0.6)
        ]
        
        let textSize = text.size(withAttributes: textAttributes)
        let textRect = CGRect(x: 10, y: 10, width: textSize.width, height: textSize.height)
        text.draw(in: textRect, withAttributes: textAttributes)
        
        // Get the final image
        if let finalImage = UIGraphicsGetImageFromCurrentImageContext() {
            // Save to photos
            UIImageWriteToSavedPhotosAlbum(finalImage, nil, nil, nil)
            debugLog("Saved debug image: \(label)")
        }
    }
}
#endif