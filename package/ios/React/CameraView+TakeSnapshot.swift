//
//  CameraView+TakeSnapshot.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.02.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

import AVFoundation
import UIKit

extension CameraView {
  func takeSnapshot(options _: NSDictionary, promise: Promise) {
    // If video is not enabled, we won't get any buffers in onFrameListeners. abort it.
    guard video else {
      promise.reject(error: .capture(.videoNotEnabled))
      return
    }

    // If after 3 seconds we still didn't receive a snapshot, we abort it.
    CameraQueues.cameraQueue.asyncAfter(deadline: .now() + 3) {
      if !promise.didResolve {
        promise.reject(error: .capture(.timedOut))
      }
    }

    // Add a listener to the onFrame callbacks which will get called later if video is enabled.
    snapshotOnFrameListeners.append { buffer in
      if promise.didResolve {
        // capture was already aborted (timed out)
        return
      }

      self.onCaptureShutter(shutterType: .snapshot)

      guard let imageBuffer = CMSampleBufferGetImageBuffer(buffer) else {
        promise.reject(error: .capture(.imageDataAccessError))
        return
      }
      let ciImage = CIImage(cvPixelBuffer: imageBuffer)
      let orientation = self.cameraSession.outputOrientation
      let image = UIImage(ciImage: ciImage, scale: 1.0, orientation: orientation.imageOrientation)
      do {
        let path = try FileUtils.writeUIImageToTempFile(image: image)
        promise.resolve([
          "path": path.absoluteString,
          "width": image.size.width,
          "height": image.size.height,
          "orientation": orientation.jsValue,
          "isMirrored": false,
        ])
      } catch let error as CameraError {
        promise.reject(error: error)
      } catch {
        promise.reject(error: .capture(.unknown(message: "An unknown error occured while capturing the snapshot!")), cause: error as NSError)
      }
    }
  }
}
