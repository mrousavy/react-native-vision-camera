//
//  ResizeMode.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 22.09.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation

/**
 A ResizeMode used for the PreviewView.
 */
enum ResizeMode {
  /**
   Keep aspect ratio, but fill entire parent view (centered).
   */
  case cover
  /**
   Keep aspect ratio, but make sure the entire content is visible even if it introduces additional blank areas (centered).
   */
  case contain

  init(fromTypeScriptUnion union: String) {
    switch union {
    case "cover":
      self = .cover
    case "contain":
      self = .contain
    default:
      // TODO: Use the onError event for safer error handling!
      fatalError("Invalid value passed for resizeMode! (\(union))")
    }
  }
}
