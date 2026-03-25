//
//  CameraView.swift
//  mrousavy
//
//  Created by Marc Rousavy on 09.11.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation
import UIKit
import MetalKit

// TODOs for the CameraView which are currently too hard to implement either because of AVFoundation's limitations, or my brain capacity
//
// CameraView+RecordVideo
// TODO: Better startRecording()/stopRecording() (promise + callback, wait for TurboModules/JSI)
//
// CameraView+TakePhoto
// TODO: Photo HDR

// MARK: - CameraView

public final class CameraView: UIView, CameraSessionDelegate, PreviewViewDelegate, FpsSampleCollectorDelegate {
    // pragma MARK: React Properties
    
    var lutTexture: MTLTexture?
    var lensLutTexture: MTLTexture?
    
    // props that require reconfiguring
    @objc var cameraId: NSString?
    @objc var enableDepthData = false
    @objc var enablePortraitEffectsMatteDelivery = false
    @objc var enableBufferCompression = false
    @objc var isMirrored = false
    @objc var lensLUTAsset: NSDictionary? {
        didSet {
            if lensLUTAsset == nil {
                lensLutTexture  = nil
                updatePreview()
                return
            }
            
            guard let lensLutUIImage = RCTConvert.uiImage(lensLUTAsset) else {
                return
            }
            
            guard let cgImage = lensLutUIImage.cgImage else {
                return
            }
            
            let textureLoader = MTKTextureLoader(device: MTLCreateSystemDefaultDevice()!)
            
            lensLutTexture = try? textureLoader.newTexture(cgImage: cgImage, options: [
                MTKTextureLoader.Option.SRGB : false
            ])
            
            if lensLutTexture == nil {
                print("Failed to create lens LUT texture")
            }
            else {
                print("Lens LUT Loaded")
            }
            
            updatePreview()
        }
    }
    @objc var lutAsset: NSDictionary? {
        didSet{
            // If lutAsset is nil, clear the LUT texture
            guard let lutAsset = lutAsset else {
                lutTexture = nil
                updatePreview()
                return
            }
            
            guard let lutUIImage = RCTConvert.uiImage(lutAsset) else {
                print("❌ Failed to convert LUT asset")
                lutTexture = nil
                updatePreview()
                return
            }
            
            guard let cgImage = lutUIImage.cgImage else {
                lutTexture = nil
                updatePreview()
                return
            }
            
            let textureLoader = MTKTextureLoader(device: MTLCreateSystemDefaultDevice()!)
            
            lutTexture = try? textureLoader.newTexture(cgImage: cgImage, options: [
                MTKTextureLoader.Option.SRGB : false
            ])
            if lutTexture == nil {
                print("Failed to create LUT texture")
            } else {
                print("LUT Loaded")
            }
            
            updatePreview()
        }
    }
    
    // use cases
    @objc var photo = false
    @objc var video = false
    @objc var audio = false
    @objc var enableFrameProcessor = false
    @objc var codeScannerOptions: NSDictionary?
    @objc var pixelFormat: NSString?
    @objc var enableLocation = false
    @objc var preview = true {
        didSet {
            updatePreview()
        }
    }
    
    @objc var fisheyeW = false
    @objc var fisheyeF = false
    
    // props that require format reconfiguring
    @objc var format: NSDictionary?
    @objc var minFps: NSNumber?
    @objc var maxFps: NSNumber?
    @objc var videoHdr = false
    @objc var photoHdr = false
    @objc var photoQualityBalance: NSString?
    @objc var lowLightBoost = false
    @objc var outputOrientation: NSString?
    @objc var videoBitRateOverride: NSNumber?
    @objc var videoBitRateMultiplier: NSNumber?
    
    // other props
    @objc var isActive = false
    @objc var torch = "off"
    @objc var zoom: NSNumber = 1.0 // in "factor"
    @objc var exposure: NSNumber = 0.0
    @objc var temperature: NSNumber = 5800.0
    @objc var tint: NSNumber = 0.0
    @objc var videoStabilizationMode: NSString?
    @objc var resizeMode: NSString = "cover" {
        didSet {
            updatePreview()
        }
    }
    
    // events
    @objc var onInitializedEvent: RCTDirectEventBlock?
    @objc var onErrorEvent: RCTDirectEventBlock?
    @objc var onStartedEvent: RCTDirectEventBlock?
    @objc var onStoppedEvent: RCTDirectEventBlock?
    @objc var onPreviewStartedEvent: RCTDirectEventBlock?
    @objc var onPreviewStoppedEvent: RCTDirectEventBlock?
    @objc var onShutterEvent: RCTDirectEventBlock?
    @objc var onPreviewOrientationChangedEvent: RCTDirectEventBlock?
    @objc var onOutputOrientationChangedEvent: RCTDirectEventBlock?
    @objc var onViewReadyEvent: RCTDirectEventBlock?
    @objc var onAverageFpsChangedEvent: RCTDirectEventBlock?
    @objc var onCodeScannedEvent: RCTDirectEventBlock?
    
    // zoom
    @objc var enableZoomGesture = false {
        didSet {
            if enableZoomGesture {
                addPinchGestureRecognizer()
            } else {
                removePinchGestureRecognizer()
            }
        }
    }
    
#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
    @objc public var frameProcessor: FrameProcessor?
#endif
    
    // pragma MARK: Internal Properties
    var cameraSession = CameraSession()
    var previewView: PreviewView?
    var previewMetalView: PreviewMetalView?
    var videoFilter: FilterRenderer?
    var isMounted = false
    private var currentConfigureCall: DispatchTime?
    private let fpsSampleCollector = FpsSampleCollector()
    
    // CameraView+Zoom
    var pinchGestureRecognizer: UIPinchGestureRecognizer?
    var pinchScaleOffset: CGFloat = 1.0
    
    // CameraView+TakeSnapshot
    var latestVideoFrame: Snapshot?
    
    // pragma MARK: Setup
    
    override public init(frame: CGRect) {
        super.init(frame: frame)
        cameraSession.delegate = self
        fpsSampleCollector.delegate = self
        updatePreview()
    }
    
    @available(*, unavailable)
    required init?(coder _: NSCoder) {
        fatalError("init(coder:) is not implemented.")
    }
    
    override public func willMove(toSuperview newSuperview: UIView?) {
        super.willMove(toSuperview: newSuperview)
        
        if newSuperview != nil {
            fpsSampleCollector.start()
            if !isMounted {
                isMounted = true
                onViewReadyEvent?(nil)
            }
        } else {
            fpsSampleCollector.stop()
        }
    }
    
    override public func layoutSubviews() {
        if let previewView {
            previewView.frame = frame
            previewView.bounds = bounds
        }
        if let previewMetalView {
            previewMetalView.frame = frame
            previewMetalView.bounds = bounds
        }
    }
    
    func getPixelFormat() -> PixelFormat {
        // TODO: Use ObjC RCT enum parser for this
        if let pixelFormat = pixelFormat as? String {
            do {
                return try PixelFormat(jsValue: pixelFormat)
            } catch {
                if let error = error as? CameraError {
                    onError(error)
                } else {
                    onError(.unknown(message: error.localizedDescription, cause: error as NSError))
                }
            }
        }
        return .yuv
    }
    
    func getTorch() -> Torch {
        // TODO: Use ObjC RCT enum parser for this
        if let torch = try? Torch(jsValue: torch) {
            return torch
        }
        return .off
    }
    
    func getPhotoQualityBalance() -> QualityBalance {
        if let photoQualityBalance = photoQualityBalance as? String,
           let balance = try? QualityBalance(jsValue: photoQualityBalance) {
            return balance
        }
        return .balanced
    }
    
    // pragma MARK: Props updating
    override public final func didSetProps(_ changedProps: [String]!) {
        VisionLogger.log(level: .info, message: "Updating \(changedProps.count) props: [\(changedProps.joined(separator: ", "))]")
        let now = DispatchTime.now()
        currentConfigureCall = now
        
        cameraSession.configure { [self] config in
            // Check if we're still the latest call to configure { ... }
            guard currentConfigureCall == now else {
                // configure waits for a lock, and if a new call to update() happens in the meantime we can drop this one.
                // this works similar to how React implemented concurrent rendering, the newer call to update() has higher priority.
                VisionLogger.log(level: .info, message: "A new configure { ... } call arrived, aborting this one...")
                throw CameraConfiguration.AbortThrow.abort
            }
            
            // Input Camera Device
            config.cameraId = cameraId as? String
            config.isMirrored = isMirrored
            
            // Photo
            if photo {
                config.photo = .enabled(config: CameraConfiguration.Photo(qualityBalance: getPhotoQualityBalance(),
                                                                          enableDepthData: enableDepthData,
                                                                          enablePortraitEffectsMatte: enablePortraitEffectsMatteDelivery))
            } else {
                config.photo = .disabled
            }
            
            // Video/Frame Processor
            if video || enableFrameProcessor {
                config.video = .enabled(config: CameraConfiguration.Video(pixelFormat: getPixelFormat(),
                                                                          enableBufferCompression: enableBufferCompression,
                                                                          enableHdr: videoHdr,
                                                                          enableFrameProcessor: enableFrameProcessor))
            } else {
                config.video = .disabled
            }
            
            // Audio
            if audio {
                config.audio = .enabled(config: CameraConfiguration.Audio())
            } else {
                config.audio = .disabled
            }
            
            // Code Scanner
            if let codeScannerOptions {
                let options = try CodeScannerOptions(fromJsValue: codeScannerOptions)
                config.codeScanner = .enabled(config: CameraConfiguration.CodeScanner(options: options))
            } else {
                config.codeScanner = .disabled
            }
            
            // Location tagging
            config.enableLocation = enableLocation && isActive
            
            // Video Stabilization
            if let jsVideoStabilizationMode = videoStabilizationMode as? String {
                let videoStabilizationMode = try VideoStabilizationMode(jsValue: jsVideoStabilizationMode)
                config.videoStabilizationMode = videoStabilizationMode
            } else {
                config.videoStabilizationMode = .off
            }
            
            // Orientation
            if let jsOrientation = outputOrientation as? String {
                let outputOrientation = try OutputOrientation(jsValue: jsOrientation)
                config.outputOrientation = outputOrientation
            } else {
                config.outputOrientation = .device
            }
            
            // Format
            if let jsFormat = format {
                let format = try CameraDeviceFormat(jsValue: jsFormat)
                config.format = format
            } else {
                config.format = nil
            }
            
            // Side-Props
            config.minFps = minFps?.int32Value
            config.maxFps = maxFps?.int32Value
            config.enableLowLightBoost = lowLightBoost
            config.torch = try Torch(jsValue: torch)
            
            // Zoom
            config.zoom = zoom.doubleValue
            
            // Exposure
            config.exposure = exposure.floatValue
            
            // Temperature
            config.temperature = temperature.floatValue
            
            // Tint
            config.tint = tint.floatValue
            
            // isActive
            config.isActive = isActive
        }
        
        // Store `zoom` offset for native pinch-gesture
        if changedProps.contains("zoom") {
            pinchScaleOffset = zoom.doubleValue
        }
        
        if let previewMetalView = previewMetalView {
            previewMetalView.fisheyeW = self.fisheyeW
        }
        
        if let previewMetalView = previewMetalView {
            previewMetalView.fisheyeF = self.fisheyeF
        }
        
        // Prevent phone from going to sleep
        UIApplication.shared.isIdleTimerDisabled = isActive
    }
    
    func updatePreview() {
        if preview && previewView == nil {
            // Always create PreviewView for normal camera preview
            previewView = cameraSession.createPreviewView(frame: frame)
            previewView!.delegate = self
            addSubview(previewView!)
            
            // Only add LUT filter and Metal view if LUT texture is available
            if let lutTexture = lutTexture {
                videoFilter = LutMetalRenderer(lutTexture: lutTexture,lensLutTexture: lensLutTexture!)
                previewMetalView = PreviewMetalView(frame: frame)
                addSubview(previewMetalView!)
                bringSubviewToFront(previewMetalView!)
                // Hide the normal preview when using LUT
                previewView!.isHidden = true
            } else {
                // No LUT, use normal preview
                videoFilter?.reset()
                videoFilter = nil
                previewMetalView?.removeFromSuperview()
                previewMetalView = nil
                previewView!.isHidden = false
            }
        } else if !preview && previewView != nil {
            // Remove PreviewView and destroy it
            previewView?.removeFromSuperview()
            previewView = nil
            previewMetalView?.removeFromSuperview()
            previewMetalView = nil
            videoFilter?.reset()
            videoFilter = nil
        } else if preview && previewView != nil {
            // Preview already exists, update LUT setup if needed
            if let lutTexture = lutTexture {
                // LUT is available, recreate filter with new texture (in case texture changed)
                videoFilter?.reset()
                videoFilter = LutMetalRenderer(lutTexture: lutTexture,lensLutTexture: lensLutTexture)
                if previewMetalView == nil {
                    previewMetalView = PreviewMetalView(frame: frame)
                    addSubview(previewMetalView!)
                    bringSubviewToFront(previewMetalView!)
                }
                // Hide the normal preview when using LUT
                previewView!.isHidden = true
            } else {
                // No LUT, remove filter and Metal view, show normal preview
                videoFilter?.reset()
                videoFilter = nil
                previewMetalView?.removeFromSuperview()
                previewMetalView = nil
                previewView!.isHidden = false
            }
        }
        
        if let previewView {
            // Update resizeMode from React
            let parsed = try? ResizeMode(jsValue: resizeMode as String)
            previewView.resizeMode = parsed ?? .cover
        }
    }
    
    
    // pragma MARK: Event Invokers
    
    func onError(_ error: CameraError) {
        VisionLogger.log(level: .error, message: "Invoking onError(): \(error.message)")
        
        var causeDictionary: [String: Any]?
        if case let .unknown(_, cause) = error,
           let cause = cause {
            causeDictionary = [
                "code": cause.code,
                "domain": cause.domain,
                "message": cause.description,
                "details": cause.userInfo,
            ]
        }
        onErrorEvent?([
            "code": error.code,
            "message": error.message,
            "cause": causeDictionary ?? NSNull(),
        ])
    }
    
    func onSessionInitialized() {
        onInitializedEvent?([:])
    }
    
    func onCameraStarted() {
        onStartedEvent?([:])
    }
    
    func onCameraStopped() {
        onStoppedEvent?([:])
    }
    
    func onPreviewStarted() {
        onPreviewStartedEvent?([:])
    }
    
    func onPreviewStopped() {
        onPreviewStoppedEvent?([:])
    }
    
    func onCaptureShutter(shutterType: ShutterType) {
        onShutterEvent?([
            "type": shutterType.jsValue,
        ])
    }
    
    func onOutputOrientationChanged(_ outputOrientation: Orientation) {
        onOutputOrientationChangedEvent?([
            "outputOrientation": outputOrientation.jsValue,
        ])
    }
    
    func onPreviewOrientationChanged(_ previewOrientation: Orientation) {
        onPreviewOrientationChangedEvent?([
            "previewOrientation": previewOrientation.jsValue,
        ])
    }
    
    func onFrame(sampleBuffer: CMSampleBuffer, orientation: Orientation, isMirrored: Bool) {
        // Update latest frame that can be used for snapshot capture
        latestVideoFrame = Snapshot(imageBuffer: sampleBuffer, orientation: orientation)
        
        // Notify FPS Collector that we just had a Frame
        fpsSampleCollector.onTick()
        
        
        
        // Only update Metal view if it exists (i.e., when using LUT)
        if let previewMetalView = previewMetalView {
            DispatchQueue.main.async {
                let interfaceOrientation = UIApplication.shared.connectedScenes.compactMap {$0 as? UIWindowScene}.first?.interfaceOrientation
                if let unwrappedVideoDataOutputConnection = self.cameraSession.videoOutput!.connection(with: .video) {
                    let videoDevicePosition = self.cameraSession.videoDeviceInput!.device.position
                    let rotation = PreviewMetalView.Rotation(with: interfaceOrientation!,
                                                             videoOrientation: unwrappedVideoDataOutputConnection.videoOrientation,
                                                             cameraPosition: videoDevicePosition)
                    previewMetalView.mirroring = (videoDevicePosition == .front)
                    if let rotation = rotation {
                        previewMetalView.rotation = rotation
                    }
                }
            }
            
            guard let videoPixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer),
                  let formatDescription = CMSampleBufferGetFormatDescription(sampleBuffer) else {
                return
            }
            
            var finalVideoPixelBuffer = videoPixelBuffer
            if let filter = videoFilter {
                if !filter.isPrepared {
                    /*
                     outputRetainedBufferCountHint is the number of pixel buffers the renderer retains. This value informs the renderer
                     how to size its buffer pool and how many pixel buffers to preallocate. Allow 3 frames of latency to cover the dispatch_async call.
                     */
                    filter.prepare(with: formatDescription, outputRetainedBufferCountHint: 3)
                }
                
                // Send the pixel buffer through the filter
                guard let filteredBuffer = filter.render(pixelBuffer: finalVideoPixelBuffer,fisheyeW: self.fisheyeW,fisheyeF: self.fisheyeF) else {
                    print("Unable to filter video buffer")
                    return
                }
                
                finalVideoPixelBuffer = filteredBuffer
            }
            
            previewMetalView.pixelBuffer = finalVideoPixelBuffer
        }
        
        
#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
        if let frameProcessor = frameProcessor {
            // Call Frame Processor
            let frame = Frame(buffer: sampleBuffer,
                              orientation: orientation.imageOrientation,
                              isMirrored: isMirrored)
            frameProcessor.call(frame)
        }
#endif
    }
    
    func onCodeScanned(codes: [CameraSession.Code], scannerFrame: CameraSession.CodeScannerFrame) {
        onCodeScannedEvent?([
            "codes": codes.map { $0.toJSValue() },
            "frame": scannerFrame.toJSValue(),
        ])
    }
    
    func onAverageFpsChanged(averageFps: Double) {
        onAverageFpsChangedEvent?([
            "averageFps": averageFps,
        ])
    }
}
