//
//  MetalResizerPipeline.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.03.26.
//

import CoreVideo
import Metal
import NitroModules

/// Owns the Metal runtime objects needed to run the resize kernel for one fixed output layout.
final class MetalResizerPipeline {
  /// One specialized compute pipeline for one input format, with its
  /// precomputed threadgroup size.
  private struct Pipeline {
    let state: MTLComputePipelineState
    let threadsPerThreadgroup: MTLSize

    init(
      device: MTLDevice,
      library: MTLLibrary,
      options: ResizerOptions,
      inputFormat: MetalResizerInputFormat
    ) throws {
      let state = try MetalResizerShaderLibrary.createPipelineState(
        device: device, library: library, options: options, inputFormat: inputFormat)
      self.state = state
      self.threadsPerThreadgroup = MetalResizerShaderLibrary.optimalThreadgroupSize(for: state)
    }
  }

  private let options: ResizerOptions
  private let commandQueue: MTLCommandQueue
  private let textureCache: CVMetalTextureCache
  private let yuvPipeline: Pipeline
  private let bgraPipeline: Pipeline
  private let outputBuffer: MetalReusableBuffer

  /**
   * Builds the Metal pipeline for one fixed output size and output layout.
   */
  init(options: ResizerOptions) throws {
    guard let device = MTLCreateSystemDefaultDevice() else {
      throw RuntimeError.error(
        withMessage: "Failed to initialize Metal - no MTLDevice is available.")
    }
    guard let commandQueue = device.makeCommandQueue() else {
      throw RuntimeError.error(withMessage: "Failed to initialize Metal command queue.")
    }

    let outputWidth = Int(options.width)
    let outputHeight = Int(options.height)
    // `pixelLayout` only changes how channel values are arranged in memory, not how many are stored.
    let outputBufferLength = options.channelOrder.getOutputTotalByteCount(
      dataType: options.dataType,
      width: outputWidth,
      height: outputHeight)
    // Each supported input format has its own specialized kernel - the right
    // one is picked per frame based on the input Frame's pixel format.
    let library = try MetalResizerShaderLibrary.loadPrecompiledLibrary(device: device)
    let yuvPipeline = try Pipeline(
      device: device, library: library, options: options, inputFormat: .yuvBiplanar)
    let bgraPipeline = try Pipeline(
      device: device, library: library, options: options, inputFormat: .bgra)

    var textureCache: CVMetalTextureCache?
    let cacheStatus = CVMetalTextureCacheCreate(
      kCFAllocatorDefault, nil, device, nil, &textureCache)
    guard cacheStatus == kCVReturnSuccess, let textureCache else {
      throw RuntimeError.error(
        withMessage: "Failed to create CVMetalTextureCache (status \(cacheStatus)).")
    }

    let outputBuffer = try MetalReusableBuffer(device: device, bufferLength: outputBufferLength)

    self.options = options
    self.commandQueue = commandQueue
    self.textureCache = textureCache
    self.yuvPipeline = yuvPipeline
    self.bgraPipeline = bgraPipeline
    self.outputBuffer = outputBuffer
  }

  /**
   * The fixed output width for this pipeline instance.
   */
  private var outputWidth: Int {
    return Int(options.width)
  }

  /**
   * The fixed output height for this pipeline instance.
   */
  private var outputHeight: Int {
    return Int(options.height)
  }

  /**
   * The exact packed output size for one resized frame.
   */
  var outputByteCount: Int {
    // `pixelLayout` only changes how channel values are arranged in memory, not the total byte count.
    return options.channelOrder.getOutputTotalByteCount(
      dataType: options.dataType,
      width: outputWidth,
      height: outputHeight)
  }

  deinit {
    CVMetalTextureCacheFlush(textureCache, 0)
  }

  /**
   * Runs the resize shader for one camera frame and returns a live view over the reusable output buffer.
   */
  func run(
    pixelBuffer: CVPixelBuffer,
    rotationDegrees: Int32,
    isMirrored: Bool
  ) throws -> MetalBufferView {
    let outputBufferView = try outputBuffer.acquireView(
      width: outputWidth,
      height: outputHeight,
      channelOrder: options.channelOrder,
      dataType: options.dataType,
      pixelLayout: options.pixelLayout)
    let inputTextures = try MetalResizerInputTextures.make(
      from: pixelBuffer,
      textureCache: textureCache)
    let uniforms = makeUniforms(
      rotationDegrees: rotationDegrees,
      isMirrored: isMirrored)
    try encodeAndRun(
      inputTextures: inputTextures,
      outputBuffer: outputBufferView.buffer,
      uniforms: uniforms)
    return outputBufferView
  }

  /**
   * Builds the shader uniforms for one dispatch.
   */
  private func makeUniforms(rotationDegrees: Int32, isMirrored: Bool) -> MetalResizerUniforms {
    return MetalResizerUniforms(
      outputWidth: UInt32(outputWidth),
      outputHeight: UInt32(outputHeight),
      rotationDegrees: rotationDegrees,
      isMirrored: isMirrored ? 1 : 0)
  }

  /**
   * The specialized pipeline for one input format.
   */
  private func pipeline(for inputFormat: MetalResizerInputFormat) -> Pipeline {
    switch inputFormat {
    case .yuvBiplanar:
      return yuvPipeline
    case .bgra:
      return bgraPipeline
    }
  }

  /**
   * The threadgroup grid that covers the full output image, rounded up.
   * The kernels bounds-check `gid` themselves, so unlike `dispatchThreads`
   * this also works on GPUs without non-uniform threadgroup support (< A11).
   */
  private func threadgroupsPerGrid(threadsPerThreadgroup: MTLSize) -> MTLSize {
    return MTLSize(
      width: (outputWidth + threadsPerThreadgroup.width - 1) / threadsPerThreadgroup.width,
      height: (outputHeight + threadsPerThreadgroup.height - 1) / threadsPerThreadgroup.height,
      depth: 1)
  }

  private func encodeAndRun(
    inputTextures: MetalResizerInputTextures,
    outputBuffer: MTLBuffer,
    uniforms: MetalResizerUniforms
  ) throws {
    guard let commandBuffer = commandQueue.makeCommandBuffer() else {
      throw RuntimeError.error(withMessage: "Failed to create Metal command buffer.")
    }
    guard let encoder = commandBuffer.makeComputeCommandEncoder() else {
      throw RuntimeError.error(withMessage: "Failed to create Metal compute command encoder.")
    }
    var uniforms = uniforms

    let pipeline = pipeline(for: inputTextures.format)
    encoder.setComputePipelineState(pipeline.state)
    switch inputTextures {
    case .yuvBiplanar(let yPlane, let uvPlane):
      encoder.setTexture(yPlane.texture, index: 0)
      encoder.setTexture(uvPlane.texture, index: 1)
    case .bgra(let texture):
      encoder.setTexture(texture.texture, index: 0)
    }
    encoder.setBuffer(outputBuffer, offset: 0, index: 0)
    encoder.setBytes(&uniforms, length: MemoryLayout<MetalResizerUniforms>.stride, index: 1)
    encoder.dispatchThreadgroups(
      threadgroupsPerGrid(threadsPerThreadgroup: pipeline.threadsPerThreadgroup),
      threadsPerThreadgroup: pipeline.threadsPerThreadgroup)
    encoder.endEncoding()

    commandBuffer.commit()
    commandBuffer.waitUntilCompleted()

    // Keep the CoreVideo-backed textures alive until GPU execution has finished.
    withExtendedLifetime(inputTextures) {}

    guard commandBuffer.status == .completed else {
      let message =
        commandBuffer.error?.localizedDescription ?? "Unknown Metal command buffer error."
      throw RuntimeError.error(
        withMessage:
          "Metal resize pipeline failed (status \(commandBuffer.status.rawValue)): \(message)")
    }
  }
}
