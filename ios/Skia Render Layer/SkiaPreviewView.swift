//
//  SkiaPreviewView.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 19.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation

@available(iOS 13.0, *)
class SkiaPreviewLayer: CAMetalLayer {
  override init() {
    super.init()
    
    framebufferOnly = false
    device = MTLCreateSystemDefaultDevice()
    isOpaque = false
    contentsScale = pixelDensity
    pixelFormat = .bgra8Unorm
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  var pixelDensity: CGFloat {
    return UIScreen.main.scale
  }
}

class SkiaPreviewView: PreviewView {
  private let skiaRenderer: SkiaRenderer
  private lazy var displayLink = {
    return SkiaPreviewDisplayLink(callback: { [weak self] timestamp in
      // Called everytime to render the screen - e.g. 60 FPS
      if let self = self {
        self.skiaRenderer.renderLatestFrame(to: self.layer)
      }
    })
  }()
  override final class var layerClass: AnyClass {
    return SkiaPreviewLayer.self
  }
  override var layer: SkiaPreviewLayer {
      return super.layer as! SkiaPreviewLayer
  }
  
  init(frame: CGRect, skiaRenderer: SkiaRenderer) {
    self.skiaRenderer = skiaRenderer
    super.init(frame: frame)
  }
  
  deinit {
    self.displayLink.stop()
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override func willMove(toSuperview newSuperview: UIView?) {
    if newSuperview != nil {
      self.displayLink.start()
    } else {
      self.displayLink.stop()
    }
  }
  
  override func layoutSubviews() {
    let width = self.bounds.size.width
    let height = self.bounds.size.height
    layer.frame = CGRect(x: 0, y: 0, width: width, height: height)
    layer.drawableSize = CGSizeMake(width * layer.pixelDensity,
                                    height * layer.pixelDensity)
  }
}
