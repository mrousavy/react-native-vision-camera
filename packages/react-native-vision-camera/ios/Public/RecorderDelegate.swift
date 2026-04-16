//
//  MediaSampleMetadata.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import AVFoundation
import Foundation

public protocol RecorderDelegate: AnyObject {
  /**
   * Called right before starting the Recorder.
   *
   * This is a good time to ensure any required
   * inputs (such as an Audio Session) are running.
   */
  func onRecorderWillStart()
  /**
   * Called right after the Recorder did stop
   * and finished writing.
   *
   * This is a good time to stop any inputs
   * (such as an Audio Session) if no longer
   * used anywhere else.
   */
  func onRecorderDidStop()
}
