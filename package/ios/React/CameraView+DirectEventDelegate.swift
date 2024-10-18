//
//  CameraView+DirectEventDelegate.swift
//  Pods
//
//  Created by Hanno Gödecke on 18.10.24.
//

@objc public protocol RNCameraViewDirectEventDelegate: AnyObject {
    func onInitialized()
    func onError(error: NSDictionary)
    func onViewReady()
    func onStarted()
    func onStopped()
    func onShutter(message: NSDictionary)
    func onCodeScanned(message: NSDictionary)
}
