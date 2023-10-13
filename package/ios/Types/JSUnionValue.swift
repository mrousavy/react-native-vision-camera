//
//  JSUnionValue.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 13.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation

protocol JSUnionValue {
  init(jsValue: String) throws

  var jsValue: String { get }
}
