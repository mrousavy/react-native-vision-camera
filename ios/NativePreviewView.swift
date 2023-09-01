//
//  NativePreviewView.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 30.11.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation
import UIKit

class NativePreviewView: PreviewView {
  /// Convenience wrapper to get layer as its statically known type.
  var videoPreviewLayer: AVCaptureVideoPreviewLayer {
    // swiftlint:disable force_cast
    return layer as! AVCaptureVideoPreviewLayer
    // swiftlint:enable force_cast
  }

  override public class var layerClass: AnyClass {
    return AVCaptureVideoPreviewLayer.self
  }

  init(frame: CGRect, session: AVCaptureSession) {
    super.init(frame: frame)
    videoPreviewLayer.session = session
    videoPreviewLayer.videoGravity = .resizeAspectFill
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) is not implemented!")
  }
}
