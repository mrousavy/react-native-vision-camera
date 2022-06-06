import AVFoundation
import Photos.PHPhotoLibrary

private var delegatesReferences: [NSObject] = []

// MARK: - RAWCaptureDelegate

class RAWCaptureDelegate: NSObject, AVCapturePhotoCaptureDelegate {
  private let promise: Promise
  private var rawFileURL: URL?
  private var compressedData: Data?

  var didFinish: (() -> Void)?

  required init(promise: Promise) {
    self.promise = promise
    super.init()
    delegatesReferences.append(self)
  }

  // Store the RAW file and compressed photo data until the capture finishes.
  func photoOutput(_: AVCapturePhotoOutput,
                   didFinishProcessingPhoto photo: AVCapturePhoto,
                   error: Error?) {
    guard error == nil else {
      print("Error capturing photo: \(error!)")
      return
    }

    // Access the file data representation of this photo.
    guard let photoData = photo.fileDataRepresentation() else {
      print("No photo data to write.")
      return
    }

    if photo.isRawPhoto {
      // Generate a unique URL to write the RAW file.
      rawFileURL = makeUniqueDNGFileURL()
      do {
        // Write the RAW (DNG) file data to a URL.
        try photoData.write(to: rawFileURL!)

        let exif = photo.metadata["{Exif}"] as? [String: Any]
        let width = exif?["PixelXDimension"]
        let height = exif?["PixelYDimension"]
        promise.resolve([
          "path": String(describing: rawFileURL).components(separatedBy: "Optional(file://")[1].components(separatedBy: ")")[0],
          "width": width as Any,
          "height": height as Any,
          "isRawPhoto": photo.isRawPhoto,
          "metadata": photo.metadata,
          "thumbnail": photo.embeddedThumbnailPhotoFormat as Any,
        ])
      } catch {
        fatalError("Couldn't write DNG file to the URL.")
      }
    } else {
      // Store compressed bitmap data.
      compressedData = photoData
    }
  }

  private func makeUniqueDNGFileURL() -> URL {
    let tempDir = FileManager.default.temporaryDirectory
    let fileName = ProcessInfo.processInfo.globallyUniqueString
    return tempDir.appendingPathComponent(fileName).appendingPathExtension("dng")
  }

  func photoOutput(_: AVCapturePhotoOutput,
                   didFinishCaptureFor _: AVCaptureResolvedPhotoSettings,
                   error: Error?) {
    // Call the "finished" closure, if set.
    defer { didFinish?() }

    guard error == nil else {
      print("Error capturing photo: \(error!)")
      return
    }

    // Ensure the RAW and processed photo data exists.
    guard let rawFileURL = rawFileURL else {
      print("The expected photo data isn't available.")
      return
    }

    // Request add-only access to the user's Photos library (if not already granted).
    if #available(iOS 14, *) {
      PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
        // Don't continue if not authorized.
        guard status == .authorized else { return }

        PHPhotoLibrary.shared().performChanges {
          // Save the RAW (DNG) file as the main resource for the Photos asset.
          let creationRequest = PHAssetCreationRequest.forAsset()
          let options = PHAssetResourceCreationOptions()
          options.shouldMoveFile = true
          creationRequest.addResource(with: .photo,
                                      fileURL: rawFileURL,
                                      options: options)
        } completionHandler: { _, _ in
          // Process the Photos library error.
          print("Error while saving the RAW (DNG) file.")
        }
      }
    }
  }
}
