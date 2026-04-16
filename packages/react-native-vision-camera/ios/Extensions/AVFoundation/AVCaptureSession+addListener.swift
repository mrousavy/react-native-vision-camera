///
/// AVCaptureSession+addListener.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureSession {
  func addListener(for name: NSNotification.Name, listener: @escaping (Notification) -> Void)
    -> ListenerSubscription
  {
    let observer = NotificationCenter.default.addObserver(
      forName: name,
      object: self,
      queue: .main,
      using: listener)
    return ListenerSubscription(remove: {
      NotificationCenter.default.removeObserver(observer)
    })
  }
}
