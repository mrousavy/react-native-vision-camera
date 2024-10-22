//
//  CameraView+DirectEventDelegate.swift
//  Pods
//
//  Created by Hanno Gödecke on 18.10.24.
//

@objc public protocol CameraViewDirectEventDelegate: AnyObject {
    func emitOnInitializedEvent()
    func emitOnErrorEvent(_ error: [String: Any])
    func emitOnStartedEvent()
    func emitOnStoppedEvent()
    func emitOnPreviewStartedEvent()
    func emitOnPreviewStoppedEvent()
    func emitOnShutterEvent(_ message: [String: Any])
    func emitOnPreviewOrientationChangedEvent(_ message: [String: Any])
    func emitOnOutputOrientationChangedEvent(_ message: [String: Any])
    func emitOnViewReadyEvent()
    func emitOnAverageFpsChangedEvent(_ message: [String: Any])
    func emitOnCodeScannedEvent(_ message: [String: Any])
}
