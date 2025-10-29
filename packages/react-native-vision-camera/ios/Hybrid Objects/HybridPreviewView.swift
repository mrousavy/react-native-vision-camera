///
/// HybridPreviewView.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class PreviewView: UIView {
  override public static var layerClass: AnyClass {
    return AVCaptureVideoPreviewLayer.self
  }
  
  var videoPreviewLayer: AVCaptureVideoPreviewLayer {
    return layer as! AVCaptureVideoPreviewLayer
  }
}

class HybridPreviewView: HybridPreviewViewSpec {
  var view: UIView {
    return previewView
  }
  let previewView: PreviewView
  var session: (any HybridCameraSessionSpec)? = nil {
    didSet {
      updateSession()
    }
  }
  
  override init() {
    self.previewView = PreviewView()
  }
  
  private func updateSession() {
    guard let hybridSession = session as? HybridCameraSession else { return }
    DispatchQueue.main.async {
      self.previewView.videoPreviewLayer.session = hybridSession.session
    }
  }
}
