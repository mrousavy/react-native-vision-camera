//
//  NativeGestureController.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.02.26.
//

import Foundation
import UIKit

public protocol NativeGestureController: AnyObject {
  associatedtype GestureRecognizer: UIGestureRecognizer

  /**
   * Gets the underlying `UIGestureRecognizer`.
   */
  var gestureRecognizer: GestureRecognizer { get }

  func onAttached(to preview: any HybridPreviewViewSpec)
  func onDetached(from preview: any HybridPreviewViewSpec)
}

extension NativeGestureController {
  public func onAttached(to preview: any HybridPreviewViewSpec) { /* noop */  }
  public func onDetached(from preview: any HybridPreviewViewSpec) { /* noop */  }
}
