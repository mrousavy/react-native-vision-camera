/*
See the LICENSE.txt file for this sample’s licensing information.

Abstract:
The rosy-colored filter renderer, implemented with Metal.
*/

import CoreMedia
import CoreVideo
import Metal

class LutMetalRenderer: FilterRenderer {
  
    var description: String = "Lut (Metal)"
  
    var _lutTexture: MTLTexture!
    var _lensLutTexture: MTLTexture!
    
    var isPrepared = false
    
    
    private(set) var inputFormatDescription: CMFormatDescription?
    
    private(set) var outputFormatDescription: CMFormatDescription?
    
    private var outputPixelBufferPool: CVPixelBufferPool?
    
    private let metalDevice = MTLCreateSystemDefaultDevice()!
    
    private var computePipelineState: MTLComputePipelineState?
    
    private var textureCache: CVMetalTextureCache!
    
    private lazy var commandQueue: MTLCommandQueue? = {
        return self.metalDevice.makeCommandQueue()
    }()
    
    required init(lutTexture: MTLTexture,lensLutTexture: MTLTexture?) {
        let defaultLibrary = metalDevice.makeDefaultLibrary()!
        let kernelFunction = defaultLibrary.makeFunction(name: "lutEffect")
        do {
            computePipelineState = try metalDevice.makeComputePipelineState(function: kernelFunction!)
        } catch {
            print("Could not create pipeline state: \(error)")
        }
        _lutTexture = lutTexture
        _lensLutTexture = lensLutTexture
    }
    
    func prepare(with formatDescription: CMFormatDescription, outputRetainedBufferCountHint: Int) {
        reset()
        
        (outputPixelBufferPool, _, outputFormatDescription) = allocateOutputBufferPool(with: formatDescription,
                                                                                       outputRetainedBufferCountHint: outputRetainedBufferCountHint)
        if outputPixelBufferPool == nil {
            return
        }
        inputFormatDescription = formatDescription
        
        var metalTextureCache: CVMetalTextureCache?
        if CVMetalTextureCacheCreate(kCFAllocatorDefault, nil, metalDevice, nil, &metalTextureCache) != kCVReturnSuccess {
            assertionFailure("Unable to allocate texture cache")
        } else {
            textureCache = metalTextureCache
        }
        
        isPrepared = true
    }
    
    func reset() {
        outputPixelBufferPool = nil
        outputFormatDescription = nil
        inputFormatDescription = nil
        textureCache = nil
        isPrepared = false
    }
    
    /// - Tag: FilterMetalRosy
    func render(pixelBuffer: CVPixelBuffer,fisheyeW: Bool,fisheyeF: Bool) -> CVPixelBuffer? {
        if !isPrepared {
            assertionFailure("Invalid state: Not prepared.")
            return nil
        }
        
        if(outputPixelBufferPool == nil){
            return nil
        }
        
        var newPixelBuffer: CVPixelBuffer?
        CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, outputPixelBufferPool!, &newPixelBuffer)
        guard let outputPixelBuffer = newPixelBuffer else {
            print("Allocation failure: Could not get pixel buffer from pool. (\(self.description))")
            return nil
        }
        guard let inputTexture = makeTextureFromCVPixelBuffer(pixelBuffer: pixelBuffer, textureFormat: .bgra8Unorm),
            let outputTexture = makeTextureFromCVPixelBuffer(pixelBuffer: outputPixelBuffer, textureFormat: .bgra8Unorm) else {
                return nil
        }
        
        // Set up command queue, buffer, and encoder.
        guard let commandQueue = commandQueue,
            let commandBuffer = commandQueue.makeCommandBuffer(),
            let commandEncoder = commandBuffer.makeComputeCommandEncoder() else {
                print("Failed to create a Metal command queue.")
                CVMetalTextureCacheFlush(textureCache!, 0)
                return nil
        }
        
        commandEncoder.label = "Lut Metal"
        commandEncoder.setComputePipelineState(computePipelineState!)
        commandEncoder.setTexture(inputTexture, index: 0)
      // FIX: Check for LUT texture BEFORE creating command encoder, or pass through without LUT
         guard let lutTexture = _lutTexture else {
             print(":x: LUT texture not loaded, passing through original image")
             commandEncoder.endEncoding()  // MUST call this before returning!
             CVMetalTextureCacheFlush(textureCache!, 0)
             return pixelBuffer  // Return original instead of processed
         }
      
        commandEncoder.setTexture(lutTexture, index: 1)
        commandEncoder.setTexture(_lensLutTexture, index: 2)
        commandEncoder.setTexture(outputTexture, index: 3)

        // ✅ Pass isFisheye to the shader
        var fisheyeWValue = fisheyeW ? 1 : 0
        var fisheyeFValue = fisheyeF ? 1 : 0
        var hasLens = _lensLutTexture != nil ?  1 : 0
        
        
//        print(fisheyeWValue,fisheyeFValue)
        
        commandEncoder.setBytes(&fisheyeWValue, length: MemoryLayout<Int>.size, index: 0)
        commandEncoder.setBytes(&fisheyeFValue, length: MemoryLayout<Int>.size, index: 1)
        commandEncoder.setBytes(&hasLens, length: MemoryLayout<Int>.size, index: 2)
        
        
        // Set up the thread groups.
        let width = computePipelineState!.threadExecutionWidth
        let height = computePipelineState!.maxTotalThreadsPerThreadgroup / width
        let threadsPerThreadgroup = MTLSizeMake(width, height, 1)
        let threadgroupsPerGrid = MTLSize(width: (inputTexture.width + width - 1) / width,
                                          height: (inputTexture.height + height - 1) / height,
                                          depth: 1)
        commandEncoder.dispatchThreadgroups(threadgroupsPerGrid, threadsPerThreadgroup: threadsPerThreadgroup)
        
        commandEncoder.endEncoding()
        commandBuffer.commit()
        return outputPixelBuffer
    }
    
    func makeTextureFromCVPixelBuffer(pixelBuffer: CVPixelBuffer, textureFormat: MTLPixelFormat) -> MTLTexture? {
        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)
        
        // Create a Metal texture from the image buffer.
        var cvTextureOut: CVMetalTexture?
        CVMetalTextureCacheCreateTextureFromImage(kCFAllocatorDefault, textureCache, pixelBuffer, nil, textureFormat, width, height, 0, &cvTextureOut)
        
        guard let cvTexture = cvTextureOut, let texture = CVMetalTextureGetTexture(cvTexture) else {
            CVMetalTextureCacheFlush(textureCache, 0)
            
            return nil
        }
        
        return texture
    }
}
