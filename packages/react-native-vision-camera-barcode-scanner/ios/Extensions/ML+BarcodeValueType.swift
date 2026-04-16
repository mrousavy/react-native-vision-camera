//
//  ML+BarcodeValueType.swift
//  VisionCameraBarcodeScanner
//
//  Created by Marc Rousavy on 08.02.26.
//

import MLKitBarcodeScanning

extension BarcodeValueType {
  init(fromMLKitValueType type: MLKitBarcodeScanning.BarcodeValueType) {
    switch type {
    case .unknown:
      self = .unknown
    case .contactInfo:
      self = .contactInfo
    case .email:
      self = .email
    case .ISBN:
      self = .isbn
    case .phone:
      self = .phone
    case .product:
      self = .product
    case .SMS:
      self = .sms
    case .text:
      self = .text
    case .URL:
      self = .url
    case .wiFi:
      self = .wifi
    case .geographicCoordinates:
      self = .geo
    case .calendarEvent:
      self = .calendarEvent
    case .driversLicense:
      self = .driverLicense
    default:
      self = .unknown
    }
  }
}
