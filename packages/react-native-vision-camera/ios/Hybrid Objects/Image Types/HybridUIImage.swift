//
//  HybridPhoto.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import AVFoundation
import Foundation
import NitroImage
import NitroModules

// Implementation of HybridImageSpec using NitroImage's default UIImage impl (`NativeImage`)
internal final class HybridUIImage: HybridImageSpec, NativeImage {
  let uiImage: UIImage
  init(uiImage: UIImage) {
    self.uiImage = uiImage
    super.init()
  }
}
