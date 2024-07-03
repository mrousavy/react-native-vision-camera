//
//  CameraQueues.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 22.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import Foundation

@objc
public final class CameraQueues: NSObject {
  /// The serial execution queue for camera configuration and setup.
  @objc public static let cameraQueue = DispatchQueue(label: "mrousavy/VisionCamera.main",
                                                      qos: .userInteractive,
                                                      attributes: [],
                                                      autoreleaseFrequency: .inherit,
                                                      target: nil)

  /// The serial execution queue for output processing of videos for recording or synchronous frame processing.
  @objc public static let videoQueue = DispatchQueue(label: "mrousavy/VisionCamera.video",
                                                     qos: .userInteractive,
                                                     attributes: [],
                                                     autoreleaseFrequency: .inherit,
                                                     target: nil)

  /// The serial execution queue for output processing of QR/barcodes.
  @objc public static let codeScannerQueue = DispatchQueue(label: "mrousavy/VisionCamera.codeScanner",
                                                           qos: .userInteractive,
                                                           attributes: [],
                                                           autoreleaseFrequency: .inherit,
                                                           target: nil)

  /// The serial execution queue for output processing of audio buffers.
  @objc public static let audioQueue = DispatchQueue(label: "mrousavy/VisionCamera.audio",
                                                     qos: .userInteractive,
                                                     attributes: [],
                                                     autoreleaseFrequency: .inherit,
                                                     target: nil)

  /// The serial execution queue for streaming location data.
  @objc public static let locationQueue = DispatchQueue(label: "mrousavy/VisionCamera.location",
                                                        qos: .utility,
                                                        attributes: [],
                                                        autoreleaseFrequency: .inherit,
                                                        target: nil)
}
