///
/// HybridPreviewView.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroImage
import NitroModules

final class HybridPreviewView: HybridPreviewViewSpec {
  var view: UIView = AutoLayerResizingView()
  var previewOutput: (any HybridCameraPreviewOutputSpec)? {
    didSet {
      updatePreviewLayer()
    }
  }

  var onPreviewStarted: (() -> Void)? = nil
  var onPreviewStopped: (() -> Void)? = nil
  private var isPreviewingObserver: NSKeyValueObservation? = nil

  // This field does nothing on iOS.
  var implementationMode: PreviewImplementationMode? = nil

  var resizeMode: PreviewResizeMode? = .cover {
    didSet {
      let newResizeMode = resizeMode ?? .cover
      if newResizeMode != oldValue,
        let previewLayer
      {
        DispatchQueue.main.async {
          previewLayer.videoGravity = newResizeMode.toAVLayerVideoGravity()
        }
      }
    }
  }

  var gestureControllers: [any HybridGestureControllerSpec]? {
    didSet {
      let newValue = gestureControllers
      DispatchQueue.main.async {
        for oldController in oldValue ?? [] {
          if let oldController = oldController as? any NativeGestureController {
            self.view.removeGestureRecognizer(oldController.gestureRecognizer)
            oldController.onDetached(from: self)
          }
        }
        for newController in newValue ?? [] {
          if let newController = newController as? any NativeGestureController {
            self.view.addGestureRecognizer(newController.gestureRecognizer)
            newController.onAttached(to: self)
          }
        }
      }
    }
  }

  private var previewLayer: AVCaptureVideoPreviewLayer? {
    guard let previewOutput = previewOutput as? any NativePreviewViewOutput else {
      return nil
    }
    return previewOutput.previewLayer
  }

  func convertCameraPointToViewPoint(cameraPoint: Point) throws -> Point {
    guard let previewLayer else {
      throw RuntimeError.error(
        withMessage: "Cannot convert camera point to view point - PreviewView isn't ready yet!")
    }
    let converted = previewLayer.layerPointConverted(
      fromCaptureDevicePoint: cameraPoint.toCGPoint())
    return Point(converted)
  }

  func convertViewPointToCameraPoint(viewPoint: Point) throws -> Point {
    guard let previewLayer else {
      throw RuntimeError.error(
        withMessage: "Cannot convert camera point to view point - PreviewView isn't ready yet!")
    }
    let converted = previewLayer.captureDevicePointConverted(fromLayerPoint: viewPoint.toCGPoint())
    return Point(converted)
  }

  func convertScannedObjectCoordinatesToViewCoordinates(
    scannedObject: (any HybridScannedObjectSpec)
  ) throws -> (any HybridScannedObjectSpec) {
    guard let previewLayer else {
      throw RuntimeError.error(
        withMessage:
          "Cannot convert Scanned Object to view coordinates - PreviewView isn't ready yet!")
    }
    guard let object = scannedObject as? any NativeScannedObject else {
      throw RuntimeError.error(
        withMessage: "The given `scannedObject` is not of type `NativeScannedObject`!")
    }
    guard let transformedObject = previewLayer.transformedMetadataObject(for: object.object) else {
      throw RuntimeError.error(
        withMessage: "Failed to transform the Scanned Object's coordinates into view coordinates!")
    }
    return HybridCameraObjectOutput.createHybridScannedObject(from: transformedObject)
  }

  func createMeteringPoint(viewX: Double, viewY: Double, size: Double?) throws
    -> any HybridMeteringPointSpec
  {
    guard let previewLayer else {
      throw RuntimeError.error(
        withMessage: "Cannot create MeteringPoint - PreviewView is not ready yet!")
    }
    let relativePoint = CGPoint(x: viewX, y: viewY)
    let normalizedPoint = previewLayer.captureDevicePointConverted(fromLayerPoint: relativePoint)
    return HybridMeteringPoint(
      relativeX: relativePoint.x,
      relativeY: relativePoint.y,
      relativeSize: size,
      normalizedX: normalizedPoint.x,
      normalizedY: normalizedPoint.y)
  }

  func takeSnapshot() throws -> Promise<any HybridImageSpec> {
    throw RuntimeError.error(withMessage: "takeSnapshot() is not available on iOS!")
  }

  private func updatePreviewLayer() {
    DispatchQueue.main.async {
      if let previewLayer = self.previewLayer {
        // Never touch the AVCaptureSession from the main thread.
        //
        // The deadlock this avoids (#4098, and #3356): addSublayer() takes
        // the CoreAnimation transaction lock and AVFoundation then waits on
        // the capture session lock inside layerDidBecomeVisible:, while the
        // AVFCapture KVO thread holds the session lock and waits on the CA
        // lock. Classic ABBA, and it hangs the main thread permanently.
        //
        // Detaching and re-attaching the session on the MAIN thread does fix
        // that cycle, but it then races CameraSession's serial queue:
        // AVCaptureSession is not thread-safe, so a main-thread
        // beginConfiguration/commitConfiguration pair interleaving with
        // configure()/start() produced "startRunning may not be called
        // between calls to beginConfiguration and commitConfiguration" traps
        // and attach/detachFromFigCaptureSession assertions for us.
        //
        // So: ALL session mutation goes on HybridCameraSession.queue (the
        // same serial queue configure() and start() use) and only pure
        // CoreAnimation work stays on main. The main thread never waits for
        // the session lock, so no lock cycle is possible, and no two threads
        // ever configure the session concurrently.
        let needsLayerAttach = self.view.layer.sublayers?.contains(previewLayer) != true
        if needsLayerAttach, previewLayer.session != nil {
          // The layer is session-connected and not in the layer tree yet:
          // detach on the session queue, do the CA work on main, then
          // re-attach on the session queue.
          HybridCameraSession.queue.async {
            let detachedSession = previewLayer.session
            let detachedInputPort = previewLayer.connection?.inputPorts.first
            previewLayer.session = nil
            DispatchQueue.main.async {
              self.attachAndStyleLayerOnMain(previewLayer)
              guard let session = detachedSession, let inputPort = detachedInputPort else {
                return
              }
              HybridCameraSession.queue.async {
                guard previewLayer.session == nil else {
                  // A configure() ran while the layer was detached and
                  // re-attached it itself (updateOutputs adds any preview
                  // whose session is nil); nothing left to do.
                  return
                }
                // Rebuild the preview connection the same way CameraSession
                // does (setSessionWithNoConnection plus a manual
                // AVCaptureConnection; a plain .session setter would form an
                // implicit connection to the wrong port, or none at all).
                session.beginConfiguration()
                previewLayer.setSessionWithNoConnection(session)
                let connection = AVCaptureConnection(
                  inputPort: inputPort, videoPreviewLayer: previewLayer)
                if session.canAddConnection(connection) {
                  session.addConnection(connection)
                  logger.info(
                    "preview re-attached on the session queue (deadlock-safe ordering engaged)."
                  )
                } else {
                  // The captured input port went stale (the device changed
                  // while the layer was detached); the next configure()
                  // rebuilds the preview connection from scratch.
                  logger.error(
                    "could not re-add the preview connection; the next configure() will rebuild it."
                  )
                }
                session.commitConfiguration()
              }
            }
          }
        } else {
          // Either the layer is already in the tree (pure property updates)
          // or it has no session yet (configure() has not attached one, so
          // addSublayer has no running session to contend with). Plain CA
          // work is safe as-is.
          self.attachAndStyleLayerOnMain(previewLayer)
        }
      } else {
        // If the outgoing sublayer is a session-connected preview layer,
        // detach it on the session queue first, so the layer never leaves the
        // tree or deallocates while still wired into a running session.
        let attachedPreviewLayer = self.view.layer.sublayers?
          .compactMap { $0 as? AVCaptureVideoPreviewLayer }
          .first { $0.session != nil }
        if let attachedPreviewLayer {
          HybridCameraSession.queue.async {
            attachedPreviewLayer.session = nil
            DispatchQueue.main.async {
              self.removeAllSublayersOnMain()
            }
          }
        } else {
          self.removeAllSublayersOnMain()
        }
      }
    }
  }

  /// Pure CoreAnimation work plus KVO registration. Must run on the main
  /// thread and must never touch the AVCaptureSession.
  private func attachAndStyleLayerOnMain(_ previewLayer: AVCaptureVideoPreviewLayer) {
    // Remove all sublayers that are not our AVCaptureVideoPreviewLayer
    self.view.layer.sublayers?.removeAll { $0 != previewLayer }
    if self.view.layer.sublayers?.contains(previewLayer) != true {
      // If we don't have the preview layer, we add it here
      self.view.layer.addSublayer(previewLayer)
    }
    previewLayer.frame = self.view.bounds

    // Update resizeMode
    let resizeMode = self.resizeMode ?? .cover
    previewLayer.videoGravity = resizeMode.toAVLayerVideoGravity()

    // Add listener to `isPreviewing`
    self.isPreviewingObserver = previewLayer.observe(
      \.isPreviewing,
      options: [.initial, .new, .old],
      changeHandler: { [weak self] _, change in
        guard let self else { return }
        guard let wasPreviewing = change.oldValue,
          let isPreviewing = change.newValue
        else { return }
        guard wasPreviewing != isPreviewing else { return }
        if isPreviewing {
          logger.info("PreviewView started!")
          self.onPreviewStarted?()
        } else {
          logger.info("PreviewView stopped!")
          self.onPreviewStopped?()
        }
      })
  }

  /// Main-thread teardown of the layer tree.
  private func removeAllSublayersOnMain() {
    // Remove all sublayers (including the AVCaptureVideoPreviewLayer)
    self.view.layer.sublayers?.removeAll()
    // Remove listener to `isPreviewing`
    self.onPreviewStopped?()
    self.isPreviewingObserver = nil
  }
}
