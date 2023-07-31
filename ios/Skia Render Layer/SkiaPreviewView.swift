//
//  SkiaPreviewView.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 19.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation

// MARK: - SkiaPreviewLayer

class SkiaPreviewLayer: CAMetalLayer {
  private var pixelRatio: CGFloat {
    return UIScreen.main.scale
  }

  init(device: MTLDevice) {
    super.init()

    framebufferOnly = true
    self.device = device
    isOpaque = false
    pixelFormat = .bgra8Unorm
    contentsScale = pixelRatio
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func setSize(width: CGFloat, height: CGFloat) {
    frame = CGRect(x: 0, y: 0, width: width, height: height)
    drawableSize = CGSize(width: width * pixelRatio,
                          height: height * pixelRatio)
  }
}

// MARK: - SkiaPreviewView

class SkiaPreviewView: PreviewView {
  private let skiaRenderer: SkiaRenderer
  private let previewLayer: SkiaPreviewLayer
  private lazy var displayLink = SkiaPreviewDisplayLink(callback: { [weak self] _ in
    // Called everytime to render the screen - e.g. 60 FPS
    if let self = self {
      self.skiaRenderer.renderLatestFrame(to: self.previewLayer)
    }
  })

  init(frame: CGRect, skiaRenderer: SkiaRenderer) {
    self.skiaRenderer = skiaRenderer
    previewLayer = SkiaPreviewLayer(device: skiaRenderer.metalDevice)
    super.init(frame: frame)
  }

  deinit {
    self.displayLink.stop()
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func willMove(toSuperview newSuperview: UIView?) {
    if newSuperview != nil {
      layer.addSublayer(previewLayer)
      displayLink.start()
    } else {
      previewLayer.removeFromSuperlayer()
      displayLink.stop()
    }
  }

  override func layoutSubviews() {
    previewLayer.setSize(width: bounds.size.width,
                         height: bounds.size.height)
  }
}
