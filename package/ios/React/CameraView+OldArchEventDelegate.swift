//
//  CameraView+OldArchEventDelegate.swift
//  VisionCamera
//
//  Created by Hanno Gödecke on 22.10.24.
//

// On the new arch this is implemented on CameraViewNativeComponent.mm
#if !RCT_NEW_ARCH_ENABLED
import Foundation

/**
 * This extension bridges the call to the synthesized RCTDirectEventBlock which are injected on the
 * old arch by the CameraViewManager.m into the CameraView.swift.
 */
class CameraViewOldArchEventHandler: CameraViewDirectEventDelegate {
    private weak var view: CameraView?
    init (view: CameraView) {
        self.view = view
    }
    
    public func emitOnInitializedEvent() {
        view?.onInitializedEvent?([:])
    }
    
    public func emitOnErrorEvent(_ error: [String: Any]) {
        view?.onErrorEvent?(error)
    }
    
    public func emitOnStartedEvent() {
        view?.onStartedEvent?([:])
    }
    
    public func emitOnStoppedEvent() {
        view?.onStartedEvent?([:])
    }
    
    public func emitOnPreviewStartedEvent() {
        view?.onPreviewStartedEvent?([:])
    }
    
    public func emitOnPreviewStoppedEvent() {
        view?.onPreviewStoppedEvent?([:])
    }
    
    public func emitOnShutterEvent(_ message: [String: Any]) {
        view?.onShutterEvent?(message)
    }
    
    public func emitOnPreviewOrientationChangedEvent(_ message: [String: Any]) {
        view?.onPreviewOrientationChangedEvent?(message)
    }
    
    public func emitOnOutputOrientationChangedEvent(_ message: [String: Any]) {
        view?.onOutputOrientationChangedEvent?(message)
    }
    
    public func emitOnViewReadyEvent() {
        view?.onViewReadyEvent?([:])
    }
    
    public func emitOnAverageFpsChangedEvent(_ message: [String: Any]) {
        view?.onAverageFpsChangedEvent?(message)
    }
    
    public func emitOnCodeScannedEvent(_ message: [String: Any]) {
        view?.onCodeScannedEvent?(message)
    }
}
#endif
