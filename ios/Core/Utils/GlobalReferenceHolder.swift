//
//  GlobalReferenceHolder.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 21.03.24.
//

import Foundation

class GlobalReferenceHolder: NSObject {
  private static var references: [GlobalReferenceHolder] = []

  func makeGlobal() {
    GlobalReferenceHolder.references.append(self)
  }

  func removeGlobal() {
    GlobalReferenceHolder.references.removeAll(where: { $0 == self })
  }
}
