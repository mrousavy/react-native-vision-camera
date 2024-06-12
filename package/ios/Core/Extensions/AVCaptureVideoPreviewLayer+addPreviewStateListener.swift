//
//  AVCaptureVideoPreviewLayer+addPreviewStateListener.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 12.06.24.
//

import Foundation
import AVFoundation

class ObserverHolder {
  private var observations: [NSKeyValueObservation] = []
  
  func addObserver(_ observer: NSKeyValueObservation) {
    observations.append(observer)
  }
  
  func removeObserver(_ observer: NSKeyValueObservation) {
    observations.removeAll { $0 == observer }
  }
}

extension AVCaptureVideoPreviewLayer {
  
  func addPreviewStateListener(_ onStateChanged: @escaping (_ isPreviewing: Bool) -> Void) -> ObserverHolder {
    let observerHolder = ObserverHolder()
    
    if #available(iOS 13.0, *) {
      let observer = self.observe(\.isPreviewing) { layer, change in
        print("Preview State changed: \(layer.isPreviewing)")
        onStateChanged(layer.isPreviewing)
      }
      observerHolder.addObserver(observer)
    } else {
      var innerObserver: NSKeyValueObservation? = nil
      let observer = self.observe(\.connection, changeHandler: { layer, change in
        print("Connection changed: \(layer.connection)")
        guard let connection = layer.connection else { return }
        let newInnerObserver = connection.observe(\.isActive) { connection, change in
          print("Connection.isActive changed: \(connection.isActive)")
          onStateChanged(connection.isActive)
        }
        if let innerObserver {
          observerHolder.removeObserver(innerObserver)
        }
        observerHolder.addObserver(newInnerObserver)
        innerObserver = newInnerObserver
      })
      observerHolder.addObserver(observer)
    }
    
    return observerHolder
  }
}
