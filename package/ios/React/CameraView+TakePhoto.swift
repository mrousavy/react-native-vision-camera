//
//  CameraView+TakePhoto.swift
//  mrousavy
//
//  Created by Marc Rousavy on 16.12.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation

extension CameraView {
  func takePhoto(options: NSDictionary, promise: Promise) {
    do {
      // Parse options & take a photo
      let photoOptions = try TakePhotoOptions(fromJSValue: options)
      cameraSession.takePhoto(options: photoOptions, promise: promise)
    } catch let error as CameraError {
      promise.reject(error: error)
    } catch {
      promise.reject(error: .capture(.unknown(message: error.localizedDescription)), cause: error as NSError)
    }
  }
}
