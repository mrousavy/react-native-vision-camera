//
//  SubjectAreaMonitor.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 23.04.26.
//

import AVFoundation

/// Coordinates `AVCaptureDevice.isSubjectAreaChangeMonitoringEnabled` across
/// multiple observers and multiple `HybridCameraController` instances per device.
///
/// The underlying AVFoundation flag is a single-writer state on the device —
/// enabling it for one observer and disabling it for another would clobber
/// whichever ran last. This type refcounts observers per device so that
/// monitoring is only enabled while at least one observer is registered,
/// and only disabled when the final observer is removed.
enum SubjectAreaMonitor {
  private final class Entry {
    let device: AVCaptureDevice
    var tokens: [UUID: NSObjectProtocol] = [:]
    init(device: AVCaptureDevice) { self.device = device }
  }

  private static var entries: [String: Entry] = [:]
  private static let lock = NSLock()

  /// Registers an observer for `subjectAreaDidChangeNotification` on the given device.
  ///
  /// Enables `isSubjectAreaChangeMonitoringEnabled` on the device if this is the
  /// first observer. Returns a closure that, when invoked, removes this observer
  /// and disables monitoring iff it was the last one across all callers.
  static func addObserver(
    device: AVCaptureDevice,
    handler: @escaping @Sendable () -> Void
  ) -> () -> Void {
    let key = device.uniqueID
    let id = UUID()

    lock.lock()
    defer { lock.unlock() }

    let entry = entries[key] ?? Entry(device: device)
    if entry.tokens.isEmpty {
      setMonitoringEnabled(on: device, enabled: true)
    }

    let token = NotificationCenter.default.addObserver(
      forName: AVCaptureDevice.subjectAreaDidChangeNotification,
      object: device,
      queue: nil
    ) { _ in
      handler()
    }
    entry.tokens[id] = token
    entries[key] = entry

    return {
      removeObserver(deviceKey: key, id: id)
    }
  }

  private static func removeObserver(deviceKey: String, id: UUID) {
    lock.lock()
    defer { lock.unlock() }

    guard let entry = entries[deviceKey],
          let token = entry.tokens.removeValue(forKey: id)
    else {
      return
    }

    NotificationCenter.default.removeObserver(token)

    if entry.tokens.isEmpty {
      setMonitoringEnabled(on: entry.device, enabled: false)
      entries.removeValue(forKey: deviceKey)
    }
  }

  private static func setMonitoringEnabled(on device: AVCaptureDevice, enabled: Bool) {
    do {
      try device.lockForConfiguration()
      device.isSubjectAreaChangeMonitoringEnabled = enabled
      device.unlockForConfiguration()
    } catch {
      logger.error("Failed to set subject area monitoring to \(enabled): \(error)")
    }
  }
}
