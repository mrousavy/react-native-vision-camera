//
//  AudioManager.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 02.04.24.
//

import Foundation
import React
import ReactCommon

@objc(AudioManager)
class AudioManager: RCTEventEmitter {
  
  @objc
  final func getRingerMode() -> String {
    
  }
  
  override func constantsToExport() -> [AnyHashable: Any]! {
    return [
      "shouldPlayShutterSoundRegardless": false
    ]
  }
}
