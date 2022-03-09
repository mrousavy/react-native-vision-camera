//
//  PhotoCaptureDelegate.swift
//  mrousavy
//
//  Created by Marc Rousavy on 15.12.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation

private var delegatesReferences: [NSObject] = []

// MARK: - PhotoCaptureDelegate

class PhotoCaptureDelegate: NSObject, AVCapturePhotoCaptureDelegate {
    private let promise: Promise
    
    required init(promise: Promise) {
        self.promise = promise
        super.init()
        delegatesReferences.append(self)
    }
    
    func photoOutput(_: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        defer {
            delegatesReferences.removeAll(where: { $0 == self })
        }
        if let error = error as NSError? {
            promise.reject(error: .capture(.unknown(message: error.description)), cause: error)
            return
        }
        
        let error = ErrorPointer(nilLiteral: ())
        guard let photoTempFilePath = RCTTempFilePath("jpeg", error)
        else {
            promise.reject(error: .capture(.createTempFileError), cause: error?.pointee)
            return
        }
        let url = URL(string: "file://\(photoTempFilePath)")!
        
        guard let data = photo.fileDataRepresentation() else {
            promise.reject(error: .capture(.fileError))
            return
        }
        
        do {
            try data.write(to: url)
            
            let exif = photo.metadata["{Exif}"] as? [String: Any]
            let width = exif?["PixelXDimension"]
            let height = exif?["PixelYDimension"]
            
            var captureData = [
                "path": photoTempFilePath,
                "width": width as Any,
                "height": height as Any,
                "isRawPhoto": photo.isRawPhoto,
                "metadata": photo.metadata,
                "thumbnail": photo.embeddedThumbnailPhotoFormat as Any,
            ]
            
            if let depthBuffer = photo.depthData?.depthDataMap {
                guard let depthPath = depthBuffer.toFileUrl(.PNG) else {
                    promise.reject(error: .capture(.fileError))
                    return
                }
                captureData["depthPath"] = depthPath
            }
            
            promise.resolve(captureData)
        }
        catch {
            promise.reject(error: .capture(.fileError), cause: error as NSError)
        }
    }
    
    func photoOutput(_: AVCapturePhotoOutput, didFinishCaptureFor _: AVCaptureResolvedPhotoSettings, error: Error?) {
        defer {
            delegatesReferences.removeAll(where: { $0 == self })
        }
        if let error = error as NSError? {
            promise.reject(error: .capture(.unknown(message: error.description)), cause: error)
            return
        }
    }
}
