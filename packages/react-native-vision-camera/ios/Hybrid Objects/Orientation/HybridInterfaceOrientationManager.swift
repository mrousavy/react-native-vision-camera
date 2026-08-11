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
  private var didBecomeActiveObserver: NSObjectProtocol? = nil

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

      // On a cold launch the window scene is not yet foregroundActive - during
      // init() and potentially still at this point - so interfaceOrientation
      // resolves to .unknown (treated as portrait), and orientationDidChange
      // does not fire until the device physically rotates. An app launched in
      // landscape therefore renders all outputs 90° rotated until the first
      // rotation. Emit the current orientation now (in case the scene is
      // already active), and again when the app becomes active - the moment
      // the scene state is guaranteed to be correct.
      let emitCurrentOrientation: () -> Void = { [weak self] in
        guard let self else { return }
        let interfaceOrientation = UIApplication.shared.interfaceOrientation
        guard interfaceOrientation != .unknown else { return }
        let orientation = CameraOrientation(interfaceOrientation: interfaceOrientation)
        if self.currentOrientation != orientation {
          logger.info("Interface orientation resolved: \(orientation.stringValue)")
          self.currentOrientation = orientation
          onChanged(orientation)
        }
      }
      emitCurrentOrientation()
      self.didBecomeActiveObserver = NotificationCenter.default.addObserver(
        forName: UIApplication.didBecomeActiveNotification,
        object: nil,
        queue: .main
      ) { _ in
        emitCurrentOrientation()
      }

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
      if let didBecomeActiveObserver = self.didBecomeActiveObserver {
        NotificationCenter.default.removeObserver(didBecomeActiveObserver)
        self.didBecomeActiveObserver = nil
      }
    }
  }
}
