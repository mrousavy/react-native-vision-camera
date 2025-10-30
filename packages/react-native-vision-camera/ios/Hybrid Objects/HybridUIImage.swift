//
//  HybridPhoto.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import Foundation
import AVFoundation
import NitroModules
import NitroImage

// Implementation of HybridImageSpec using NitroImage's default UIImage impl (`NativeImage`)
internal class HybridUIImage: HybridImageSpec, NativeImage {
  let uiImage: UIImage
  init(uiImage: UIImage) {
    self.uiImage = uiImage
    super.init()
  }

  var memorySize: Int {
    // Estimation on memorySize based on RGBA
    let pixelWidth = Int(uiImage.size.width * uiImage.scale)
    let pixelHeight = Int(uiImage.size.height * uiImage.scale)
    let bytesPerPixel = 4
    return pixelWidth * pixelHeight * bytesPerPixel
  }
}
