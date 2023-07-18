//
//  CameraEventEmitter.swift
//  VisionCamera
//
//  Created by Fergal Eccles on 14/07/2023.
//

import Foundation

@objc(CameraEventEmitter)
open class CameraEventEmitter: RCTEventEmitter {

  public static var emitter: RCTEventEmitter!

  override init() {
    super.init()
		CameraEventEmitter.emitter = self
  }

  open override func supportedEvents() -> [String] {
    ["onChanged"]
  }
}
