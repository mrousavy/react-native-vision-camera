///
/// HybridInterfaceOrientationManager.swift
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import UIKit

final class HybridInterfaceOrientationManager: HybridOrientationManagerSpec {
  let source: OrientationSource = .interface
  private(set) var currentOrientation: CameraOrientation? = nil
  private var observer: NSObjectProtocol? = nil

  override init() {
    super.init()
    DispatchQueue.main.async {
      let interfaceOrientation = UIApplication.shared.interfaceOrientation
      self.currentOrientation = CameraOrientation(interfaceOrientation: interfaceOrientation)
    }
  }

  func startOrientationUpdates(onChanged: @escaping (CameraOrientation) -> Void) {
    DispatchQueue.main.async {
      logger.info("Starting interface orientation updates...")

      if let observer = self.observer {
        // Remove old listeners
        NotificationCenter.default.removeObserver(observer)
        UIDevice.current.endGeneratingDeviceOrientationNotifications()
      }

      // Start new listener (beginGeneratingDeviceOrientationNotifications() can be nested)
      UIDevice.current.beginGeneratingDeviceOrientationNotifications()

      self.observer = NotificationCenter.default.addObserver(
        forName: UIDevice.orientationDidChangeNotification,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        guard let self else { return }
        let interfaceOrientation = UIApplication.shared.interfaceOrientation
        guard interfaceOrientation != .unknown else {
          logger.warning("UIInterfaceOrientation is .unknown!")
          return
        }
        let orientation = CameraOrientation(interfaceOrientation: interfaceOrientation)
        if self.currentOrientation != orientation {
          logger.info("Interface orientation changed: \(orientation.stringValue)")
          self.currentOrientation = orientation
          onChanged(orientation)
        }
      }
    }
  }

  func stopOrientationUpdates() {
    DispatchQueue.main.async {
      if let observer = self.observer {
        logger.info("Stopping interface orientation updates...")
        NotificationCenter.default.removeObserver(observer)
        UIDevice.current.endGeneratingDeviceOrientationNotifications()
      }
    }
  }
}
