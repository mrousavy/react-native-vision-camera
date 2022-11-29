//
//  CameraView+focus.swift
//  mrousavy
//
//  Created by Marc Rousavy on 19.02.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import Foundation

extension CameraView {
  private func rotateFrameSize(frameSize: CGSize, orientation: UIInterfaceOrientation) -> CGSize {
    switch (orientation) {
    case .portrait, .portraitUpsideDown, .unknown:
      // swap width and height since the input orientation is rotated
      return CGSize(width: frameSize.height, height: frameSize.width)
    case .landscapeLeft, .landscapeRight:
      // is same as camera sensor orientation
      return frameSize
    @unknown default:
      return frameSize
    }
  }
  
  func convertLayerPointToFramePoint(layerPoint point: CGPoint) -> CGPoint {
    guard let videoDeviceInput = videoDeviceInput else {
      invokeOnError(.session(.cameraNotReady))
      return .zero
    }
    guard let viewScale = window?.screen.scale else {
      invokeOnError(.unknown(message: "View has no parent Window!"))
      return .zero
    }
    
    let frameSize = rotateFrameSize(frameSize: videoDeviceInput.device.activeFormat.videoDimensions,
                                    orientation: outputOrientation)
    let viewSize = CGSize(width: previewView.bounds.width * viewScale,
                          height: previewView.bounds.height * viewScale)
    let scale = min(frameSize.width / viewSize.width, frameSize.height / viewSize.height)
    let scaledViewSize = CGSize(width: viewSize.width * scale, height: viewSize.height * scale)
    
    let overlapX = scaledViewSize.width - frameSize.width
    let overlapY = scaledViewSize.height - frameSize.height
    
    let scaledPoint = CGPoint(x: point.x * scale, y: point.y * scale)
    
    return CGPoint(x: scaledPoint.x - (overlapX / 2), y: scaledPoint.y - (overlapY / 2))
  }
  
  func focus(point: CGPoint, promise: Promise) {
    withPromise(promise) {
      guard let device = self.videoDeviceInput?.device else {
        throw CameraError.session(SessionError.cameraNotReady)
      }
      if !device.isFocusPointOfInterestSupported {
        throw CameraError.device(DeviceError.focusNotSupported)
      }
      
      let normalizedPoint = convertLayerPointToFramePoint(layerPoint: point)

      do {
        try device.lockForConfiguration()

        device.focusPointOfInterest = normalizedPoint
        device.focusMode = .continuousAutoFocus

        if device.isExposurePointOfInterestSupported {
          device.exposurePointOfInterest = normalizedPoint
          device.exposureMode = .continuousAutoExposure
        }

        device.unlockForConfiguration()
        return nil
      } catch {
        throw CameraError.device(DeviceError.configureError)
      }
    }
  }
}
