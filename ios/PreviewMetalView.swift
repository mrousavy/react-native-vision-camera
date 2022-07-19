//
//  PreviewMetalView.swift
//  VisionCamera
//
//  Created by Thomas Coldwell on 19/07/2022.
//  Copyright © 2022 mrousavy. All rights reserved.
//

import Foundation
import Metal
import MetalKit

class PreviewMetalView: MTKView {
  
  var pixelBuffer: CVPixelBuffer?
  
  private var sampler: MTLSamplerState!
  private var renderPipelineState: MTLRenderPipelineState!
  private var commandQueue: MTLCommandQueue?

  required init(coder: NSCoder) {
      super.init(coder: coder)
      // Setup a device for the MTKView to render with
      device = MTLCreateSystemDefaultDevice()
      
      configureMetal()
//
//      createTextureCache()
//
//      colorPixelFormat = .bgra8Unorm
  }
  
  func configureMetal() {
    /*
     * Sets up the metal pipeline with passthrough vertex and frag shaders,
     * a sampler descriptor for reading from the texture and a command queue
     * for the GPU
     */
    let defaultLibrary = device!.makeDefaultLibrary()!
    let pipelineDescriptor = MTLRenderPipelineDescriptor()
    pipelineDescriptor.colorAttachments[0].pixelFormat = .bgra8Unorm
    pipelineDescriptor.vertexFunction = defaultLibrary.makeFunction(name: "vertexPassThrough")
    pipelineDescriptor.fragmentFunction = defaultLibrary.makeFunction(name: "fragmentPassThrough")
    // To determine how textures are sampled, create a sampler descriptor to query for a sampler state from the device.
    let samplerDescriptor = MTLSamplerDescriptor()
    samplerDescriptor.sAddressMode = .clampToEdge
    samplerDescriptor.tAddressMode = .clampToEdge
    samplerDescriptor.minFilter = .linear
    samplerDescriptor.magFilter = .linear
    sampler = device!.makeSamplerState(descriptor: samplerDescriptor)
    // Save the render pipeline state config so the GPU can run efficiently
    do {
        renderPipelineState = try device!.makeRenderPipelineState(descriptor: pipelineDescriptor)
    } catch {
        fatalError("Unable to create preview Metal view pipeline state. (\(error))")
    }
    // Command queue for the GPU command buffers
    commandQueue = device!.makeCommandQueue()
  }
  
}
