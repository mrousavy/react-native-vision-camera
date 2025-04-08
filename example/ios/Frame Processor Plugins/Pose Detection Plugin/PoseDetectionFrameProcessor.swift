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
    private var drawSkeleton: Bool = true
    private var minPoseConfidence: CGFloat = 0.1 // Reduced threshold for testing
    
    // TFLite model properties
    private var modelSize: Int = 256 // Thunder model size (256x256)
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
        if let drawSkeletonOption = options["drawSkeleton"] as? Bool {
            self.drawSkeleton = drawSkeletonOption
        }
        
        if let minConfidence = options["minConfidence"] as? CGFloat {
            self.minPoseConfidence = minConfidence
        }
        
        // Initialize the interpreter if it's not already initialized
        if interpreter == nil {
            debugLog("Initializing interpreter for Thunder model, size: \(self.modelSize)")
            initializeInterpreter()
        }
    }
    
    private func initializeInterpreter() {
        // Clean up existing interpreter if any
        interpreter = nil
        
        // Initialize TFLite interpreter
        do {
            // Find the model file
            var possibleLocations: [String?] = []
            
            let modelName = "movenet_thunder"
            
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
            // Apply configuration changes through the configure method
            configure(options: args)
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
            // No need to validate buffer size here as it's now handled in preprocessImageWithRotation
            // which returns data with the correct size based on the actual tensor shape
            
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
        
        // Log current model size for debugging
        debugLog("Preprocessing image for model size: \(modelSize)x\(modelSize)")
        
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
        
        // Get the actual input tensor shape from the interpreter
        var actualModelSize = modelSize
        if let inputTensor = inputTensor {
            // Check if the input tensor shape is available
            let shape = inputTensor.shape
            // Convert shape to array to access dimensions
            let dimensions = inputTensor.shape.dimensions
            if dimensions.count >= 2 {
                // TFLite models typically have shape [1, height, width, channels]
                // or [height, width, channels]
                let height = dimensions.count == 4 ? dimensions[1] : dimensions[0]
                let width = dimensions.count == 4 ? dimensions[2] : dimensions[1]
                
                // Update the model size if needed
                if height == width && height > 0 {
                    actualModelSize = Int(height)
                    if actualModelSize != modelSize {
                        debugLog("Adjusting model size from \(modelSize) to \(actualModelSize) based on tensor shape")
                    }
                }
            }
        }
        
        // Thunder model expects: uint8[1,256,256,3] - 256x256 pixels with 0-255 uint8 values
        
        // Calculate the exact buffer size needed for this model
        let bytesPerChannel = 1 // 1 byte for uint8
        let bufferSize = actualModelSize * actualModelSize * 3 * bytesPerChannel
        debugLog("Allocating buffer of size: \(bufferSize) bytes for model size \(actualModelSize)x\(actualModelSize), data type: uint8")
        debugLog("Model tensor shape: [1,\(actualModelSize),\(actualModelSize),3], data type: uint8")
        
        // Bind bitmap data to UInt8
        let bitmapDataPtr = bitmapData.bindMemory(to: UInt8.self, capacity: modelSize * modelSize * 4)
        
        // For Thunder model: allocate uint8 buffer
        let rgbData = UnsafeMutablePointer<UInt8>.allocate(capacity: bufferSize)
        defer {
            rgbData.deallocate()
        }
        
        // If the actual model size is different from our current model size,
        // we need to resize the data
        if actualModelSize != modelSize {
            // Create a new scaled context with the actual model size
            guard let actualBitmapContext = CGContext(
                data: nil,
                width: actualModelSize,
                height: actualModelSize,
                bitsPerComponent: 8,
                bytesPerRow: actualModelSize * 4,
                space: rgbColorSpace,
                bitmapInfo: bitmapInfo.rawValue
            ) else {
                throw NSError(domain: "PoseDetection", code: 2, userInfo: [NSLocalizedDescriptionKey: "Failed to create actual size bitmap context"])
            }
            
            // Draw the image at the actual model size
            actualBitmapContext.draw(cgImage, in: CGRect(x: 0, y: 0, width: actualModelSize, height: actualModelSize))
            
            // Get access to the actual bitmap data
            guard let actualBitmapData = actualBitmapContext.data else {
                throw NSError(domain: "PoseDetection", code: 3, userInfo: [NSLocalizedDescriptionKey: "Failed to access actual bitmap data"])
            }
            
            let actualBitmapDataPtr = actualBitmapData.bindMemory(to: UInt8.self, capacity: actualModelSize * actualModelSize * 4)
            let actualBitmapBytesPerRow = actualModelSize * 4
            
            // For Thunder model: keep as uint8
            for y in 0..<actualModelSize {
                for x in 0..<actualModelSize {
                    let sourceOffset = y * actualBitmapBytesPerRow + x * 4
                    let destOffset = (y * actualModelSize + x) * 3
                    
                    // Copy RGB values (skip alpha)
                    rgbData[destOffset] = actualBitmapDataPtr[sourceOffset]       // R
                    rgbData[destOffset + 1] = actualBitmapDataPtr[sourceOffset + 1] // G
                    rgbData[destOffset + 2] = actualBitmapDataPtr[sourceOffset + 2] // B
                }
            }
        } else {
            // Use the original bitmap data if sizes match
            // For Thunder model: keep as uint8
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
        }
        
        // Create Data object from the RGB buffer
        return Data(bytes: rgbData, count: bufferSize)
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