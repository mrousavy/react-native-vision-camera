//
//  FourCharCode+toString.swift
//  VisionCamera
//
//  Created by Thomas Coldwell on 28/10/2021.
//  Based off this SO answer: https://stackoverflow.com/a/25625744
//

extension FourCharCode {
  func toString() -> String {
    var s = String(UnicodeScalar((self >> 24) & 255)!)
    s.append(String(UnicodeScalar((self >> 16) & 255)!))
    s.append(String(UnicodeScalar((self >> 8) & 255)!))
    s.append(String(UnicodeScalar(self & 255)!))
    return s
  }

  /// Convenience property for FourCC string representation
  var fourCCString: String {
    let bytes = [
      UInt8((self >> 24) & 0xFF),
      UInt8((self >> 16) & 0xFF),
      UInt8((self >> 8) & 0xFF),
      UInt8(self & 0xFF),
    ]
    let isPrintable = bytes.allSatisfy { $0 >= 32 && $0 < 127 }
    if isPrintable, let str = String(bytes: bytes, encoding: .ascii) {
      return str
    }
    return String(format: "0x%08X", self)
  }
}
