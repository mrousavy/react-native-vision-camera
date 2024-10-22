//
//  CameraView+OldArchEventDelegate.swift
//  VisionCamera
//
//  Created by Hanno Gödecke on 22.10.24.
//

import Foundation

/**
 * This extension bridges the call to the synthesized RCTDirectEventBlock which are injected on the
 * old arch by the CameraViewManager.m into the CameraView.swift.
 */
extension CameraView {
    public func emitOnInitializedEvent() {
        onInitializedEvent?([:])
    }
    
    public func emitOnErrorEvent(_ error: [String: Any]) {
        onErrorEvent?(error)
    }
    
    public func emitOnStartedEvent() {
        onStartedEvent?([:])
    }
    
    public func emitOnStoppedEvent() {
        onStartedEvent?([:])
    }
    
    public func emitOnPreviewStartedEvent() {
        onPreviewStartedEvent?([:])
    }
    
    public func emitOnPreviewStoppedEvent() {
        onPreviewStoppedEvent?([:])
    }
    
    public func emitOnShutterEvent(_ message: [String: Any]) {
        onShutterEvent?(message)
    }
    
    public func emitOnPreviewOrientationChangedEvent(_ message: [String: Any]) {
        onPreviewOrientationChangedEvent?(message)
    }
    
    public func emitOnOutputOrientationChangedEvent(_ message: [String: Any]) {
        onOutputOrientationChangedEvent?(message)
    }
    
    public func emitOnViewReadyEvent() {
        onViewReadyEvent?([:])
    }
    
    public func emitOnAverageFpsChangedEvent(_ message: [String: Any]) {
        onAverageFpsChangedEvent?(message)
    }
    
    public func emitOnCodeScannedEvent(_ message: [String: Any]) {
        onCodeScannedEvent?(message)
    }
}
