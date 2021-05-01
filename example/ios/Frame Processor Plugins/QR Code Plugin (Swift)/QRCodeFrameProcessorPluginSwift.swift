//
//  QRFrameProcessorPluginSwift.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 30.04.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import AVKit
import Vision

@objc(QRFrameProcessorPluginSwift)
public class QRFrameProcessorPluginSwift: NSObject, FrameProcessorPluginBase {
    @objc
    public static func callback(_: CMSampleBuffer!) -> Any! {
        // TODO: Use some AI to detect QR codes in the CMSampleBufferRef
        return []
    }
}
