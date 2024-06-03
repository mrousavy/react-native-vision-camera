//
//  OrientationManager.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import Foundation
import AVFoundation

class OrientationManager {
  private var rotationCoordinator: NSObject?
  private var previewObserver: NSKeyValueObservation?
  private var outputObserver: NSKeyValueObservation?
  
  private weak var device: AVCaptureDevice?
  private weak var previewLayer: CALayer?
  
  open weak var delegate: Delegate?
  
  var outputRotation: Double {
    if #available(iOS 17.0, *) {
      if let coordinator = rotationCoordinator as? AVCaptureDevice.RotationCoordinator {
        return coordinator.videoRotationAngleForHorizonLevelCapture
      }
    }
    return 0
  }
  var previewRotation: Double {
    if #available(iOS 17.0, *) {
      if let coordinator = rotationCoordinator as? AVCaptureDevice.RotationCoordinator {
        return coordinator.videoRotationAngleForHorizonLevelPreview
      }
    }
    return 0
  }
  
  
  // pragma MARK: UIDevice Orientation Listener (iOS <17)
  
  init() {
    if #unavailable(iOS 17.0) {
      // Before iOS 17, we use UIDevice orientation listeners.
      UIDevice.current.beginGeneratingDeviceOrientationNotifications()
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(handleDeviceOrientationChange),
        name: UIDevice.orientationDidChangeNotification,
        object: nil
      )
    }
  }
  
  deinit {
    if #unavailable(iOS 17.0) {
      // Before iOS 17, we use UIDevice orientation listeners.
      UIDevice.current.endGeneratingDeviceOrientationNotifications()
      NotificationCenter.default.removeObserver(self, name: UIDevice.orientationDidChangeNotification, object: nil)
    }
  }
  
  @objc func handleDeviceOrientationChange(notification: NSNotification) {
    // Before iOS 17, we use UIDevice orientation listeners.
    let deviceOrientation = UIDevice.current.orientation
    
    var orientation = Orientation(deviceOrientation: deviceOrientation)
    // By default, all Cameras are in 90deg rotation.
    // To properly rotate buffers up-right, we now need to counter-rotate by -90deg.
    orientation = orientation.rotateBy(orientation: .landscapeLeft)
  
    // Notify delegate listener
    delegate?.onPreviewRotationChanged(rotationAngle: orientation.degrees)
    delegate?.onOutputRotationChanged(rotationAngle: orientation.degrees)
  }
  
  
  // pragma MARK: RotationCoordinator (iOS >17)
  
  func setInputDevice(_ device: AVCaptureDevice) {
    self.device = device
    createObserver()
  }
  
  func setPreviewView(_ previewView: PreviewView) {
    self.previewLayer = previewView.videoPreviewLayer
    createObserver()
  }
  
  private func createObserver() {
    if #available(iOS 17.0, *) {
      guard let device = self.device else {
        // we need a capture device to create a RotationCoordinator. previewLayer is optional though
        return
      }
      
      // Create RotationCoordinator
      let coordinator = AVCaptureDevice.RotationCoordinator(device: device, previewLayer: previewLayer)
      // Observe Preview Rotation
      previewObserver = coordinator.observe(\.videoRotationAngleForHorizonLevelPreview) { coordinator, _ in
        self.delegate?.onPreviewRotationChanged(rotationAngle: coordinator.videoRotationAngleForHorizonLevelPreview)
      }
      // Observe Output Rotation
      outputObserver = coordinator.observe(\.videoRotationAngleForHorizonLevelCapture) { coordinator, _ in
        self.delegate?.onOutputRotationChanged(rotationAngle: coordinator.videoRotationAngleForHorizonLevelCapture)
      }
      // Trigger delegate once already
      self.delegate?.onPreviewRotationChanged(rotationAngle: coordinator.videoRotationAngleForHorizonLevelPreview)
      self.delegate?.onOutputRotationChanged(rotationAngle: coordinator.videoRotationAngleForHorizonLevelCapture)
      rotationCoordinator = coordinator
    }
  }
  
  
  protocol Delegate: NSObject {
    func onPreviewRotationChanged(rotationAngle: Double)
    func onOutputRotationChanged(rotationAngle: Double)
  }
}
