//
//  CVPixelBuffer+toFileUrl.swift
//  VisionCamera
//
//  Created by Thomas Coldwell on 09/02/2022.
//

import Foundation

enum FileType {
    case PNG
    case JPEG
}

extension CVPixelBuffer {
    func toFileUrl(_ fileType: FileType) -> String? {
        let ciimage = CIImage(cvPixelBuffer: self)
        let uiimage = UIImage(ciImage: ciimage)
        guard let data = fileType == .PNG ? uiimage.pngData() : uiimage.jpegData(compressionQuality: 1.0) else {
            ReactLogger.log(level: .error, message: "Could not create PNG representation")
            return nil
        }
        let error = ErrorPointer(nilLiteral: ())
        guard let tempFilePath = RCTTempFilePath(fileType == .PNG ? "png" : "jpeg", error)
        else {
            ReactLogger.log(level: .error, message: "Could not create temp file path")
            return nil
        }
        let url = URL(string: "file://\(tempFilePath)")!
        
        do {
            try data.write(to: url)
            return tempFilePath
        }
        catch {
            ReactLogger.log(level: .error, message: "Could not write \(fileType) to URL")
            return nil
        }
        
    }
}
