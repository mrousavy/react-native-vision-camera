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
}
