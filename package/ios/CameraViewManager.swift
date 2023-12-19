//
//  CameraViewManager.swift
//  mrousavy
//
//  Created by Marc Rousavy on 09.11.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

@objc(CameraViewManager)
final class CameraViewManager: RCTViewManager {
  // pragma MARK: Properties

  override var methodQueue: DispatchQueue! {
    return DispatchQueue.main
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override final func view() -> UIView! {
    return CameraView()
  }

  // pragma MARK: React Functions

  @objc
  final func installFrameProcessorBindings() -> NSNumber {
    #if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
      // Called on JS Thread (blocking sync method)
      let result = VisionCameraInstaller.install(to: bridge)
      return NSNumber(value: result)
    #else
      return false as NSNumber
    #endif
  }

  // TODO: The startRecording() func cannot be async because RN doesn't allow
  //       both a callback and a Promise in a single function. Wait for TurboModules?
  //       This means that any errors that occur in this function have to be delegated through
  //       the callback, but I'd prefer for them to throw for the original function instead.
  @objc
  final func startRecording(_ node: NSNumber, options: NSDictionary, onRecordCallback: @escaping RCTResponseSenderBlock) {
    let component = getCameraView(withTag: node)
    component.startRecording(options: options, callback: onRecordCallback)
  }

  @objc
  final func pauseRecording(_ node: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let component = getCameraView(withTag: node)
    component.pauseRecording(promise: Promise(resolver: resolve, rejecter: reject))
  }

  @objc
  final func resumeRecording(_ node: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let component = getCameraView(withTag: node)
    component.resumeRecording(promise: Promise(resolver: resolve, rejecter: reject))
  }

  @objc
  final func stopRecording(_ node: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let component = getCameraView(withTag: node)
    component.stopRecording(promise: Promise(resolver: resolve, rejecter: reject))
  }

  @objc
  final func takePhoto(_ node: NSNumber, options: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let component = getCameraView(withTag: node)
    component.takePhoto(options: options, promise: Promise(resolver: resolve, rejecter: reject))
  }

  @objc
  final func focus(_ node: NSNumber, point: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let promise = Promise(resolver: resolve, rejecter: reject)
    guard let x = point["x"] as? NSNumber, let y = point["y"] as? NSNumber else {
      promise.reject(error: .parameter(.invalid(unionName: "point", receivedValue: point.description)))
      return
    }
    let component = getCameraView(withTag: node)
    component.focus(point: CGPoint(x: x.doubleValue, y: y.doubleValue), promise: promise)
  }

  @objc
  final func getCameraPermissionStatus() -> String {
    let status = AVCaptureDevice.authorizationStatus(for: .video)
    return status.descriptor
  }

  @objc
  final func getMicrophonePermissionStatus() -> String {
    let status = AVCaptureDevice.authorizationStatus(for: .audio)
    return status.descriptor
  }

  @objc
  final func requestCameraPermission(_ resolve: @escaping RCTPromiseResolveBlock, reject _: @escaping RCTPromiseRejectBlock) {
    AVCaptureDevice.requestAccess(for: .video) { granted in
      let result: AVAuthorizationStatus = granted ? .authorized : .denied
      resolve(result.descriptor)
    }
  }

  @objc
  final func requestMicrophonePermission(_ resolve: @escaping RCTPromiseResolveBlock, reject _: @escaping RCTPromiseRejectBlock) {
    AVCaptureDevice.requestAccess(for: .audio) { granted in
      let result: AVAuthorizationStatus = granted ? .authorized : .denied
      resolve(result.descriptor)
    }
  }

  // MARK: Private

  private func getCameraView(withTag tag: NSNumber) -> CameraView {
    // swiftlint:disable force_cast
    return bridge.uiManager.view(forReactTag: tag) as! CameraView
    // swiftlint:enable force_cast
  }
}
