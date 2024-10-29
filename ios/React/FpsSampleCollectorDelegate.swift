//
//  FpsSampleCollectorDelegate.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 22.04.24.
//

import Foundation

protocol FpsSampleCollectorDelegate: AnyObject {
  /**
   * Called every second with a new average FPS over the last samples.
   */
  func onAverageFpsChanged(averageFps: Double)
}
