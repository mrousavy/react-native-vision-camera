//
//  CameraQueues.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 22.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import Foundation

@objc
public class CameraQueues: NSObject {
  /// The serial execution queue for the camera preview layer (input stream) as well as output processing of photos.
  @objc public static let cameraQueue = DispatchQueue(label: "com.mrousavy.vision.camera-queue",
                                                      qos: .userInteractive,
                                                      attributes: [],
                                                      autoreleaseFrequency: .inherit,
                                                      target: nil)
  /// The serial execution queue for output processing of videos as well as frame processors.
  @objc public static let videoQueue = DispatchQueue(label: "com.mrousavy.vision.video-queue",
                                                     qos: .userInteractive,
                                                     attributes: [],
                                                     autoreleaseFrequency: .inherit,
                                                     target: nil)

  // TODO: Is it a good idea to use a separate queue for audio output processing?
  /// The serial execution queue for output processing of audio buffers.
  @objc public static let audioQueue = DispatchQueue(label: "com.mrousavy.vision.audio-queue",
                                                     qos: .userInteractive,
                                                     attributes: [],
                                                     autoreleaseFrequency: .inherit,
                                                     target: nil)
}
