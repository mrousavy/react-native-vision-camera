#include <metal_stdlib>
using namespace metal;

struct ResizeUniforms {
  uint outputWidth;
  uint outputHeight;
  int rotationDegrees;
  uint isMirrored;
};

constexpr sampler resizeSampler(coord::normalized, address::clamp_to_edge, filter::linear);

// 0u == ChannelOrder::RGB, 1u == ChannelOrder::BGR
constant uint kChannelOrder [[function_constant(0)]];
// 0u == PixelLayout::INTERLEAVED == HWC / NHWC, 1u == PixelLayout::PLANAR == CHW / NCHW
constant uint kPixelLayout [[function_constant(1)]];
// Number of channels per pixel. e.g. for RGB/BGR, this is 3u.
constant uint kChannelCount [[function_constant(2)]];
// 0u == ScaleMode::COVER, 1u == ScaleMode::CONTAIN, 2u == ScaleMode::STRETCH
constant uint kScaleMode [[function_constant(3)]];

// MARK: Shared resize/rotate/mirror logic

/**
 * Maps one output pixel back to a normalized input coordinate, applying the
 * scale mode, the inverse rotation and the mirror.
 * Returns float2(-1) if the output pixel lies outside the rendered source
 * (e.g. contain-mode black bars) - the caller should write black then.
 */
inline float2 outputToInputCoordinate(
  uint2 gid,
  float2 sourceSize,
  constant ResizeUniforms& uniforms
) {
  float2 outputSize = float2(uniforms.outputWidth, uniforms.outputHeight);
  float2 outputCoordinate = (float2(gid) + 0.5f) / outputSize;

  int normalizedRotation = uniforms.rotationDegrees % 360;
  if (normalizedRotation < 0) {
    normalizedRotation += 360;
  }

  // The scale mode fits the UPRIGHT content into the output - for 90°/270°
  // rotated buffers the upright content's aspect ratio is the buffer's
  // aspect ratio flipped.
  bool isSideways = normalizedRotation == 90 || normalizedRotation == 270;
  if (isSideways) {
    sourceSize = sourceSize.yx;
  }

  float2 coordinate;
  switch (kScaleMode) {
    case 0u: { // 0u == ScaleMode::COVER
      float scale = max(outputSize.x / sourceSize.x, outputSize.y / sourceSize.y);
      float2 renderedSourceSizeInOutput = sourceSize * scale;
      float2 renderedSourceOffsetInOutput = (outputSize - renderedSourceSizeInOutput) * 0.5f;
      coordinate = ((outputCoordinate * outputSize) - renderedSourceOffsetInOutput) / renderedSourceSizeInOutput;
      break;
    }
    case 1u: { // 1u == ScaleMode::CONTAIN
      float scale = min(outputSize.x / sourceSize.x, outputSize.y / sourceSize.y);
      float2 renderedSourceSizeInOutput = sourceSize * scale;
      float2 renderedSourceOffsetInOutput = (outputSize - renderedSourceSizeInOutput) * 0.5f;
      coordinate = ((outputCoordinate * outputSize) - renderedSourceOffsetInOutput) / renderedSourceSizeInOutput;
      // Contain mode pads outside the rendered source with black bars.
      bool isOutsideSource = coordinate.x < 0.0f || coordinate.x > 1.0f || coordinate.y < 0.0f || coordinate.y > 1.0f;
      if (isOutsideSource) {
        return float2(-1.0f);
      }
      break;
    }
    case 2u: { // 2u == ScaleMode::STRETCH
      // Independent per-axis stretching: the entire source [0,1]^2 maps to the
      // entire output [0,1]^2. Aspect ratio is NOT preserved.
      coordinate = outputCoordinate;
      break;
    }
    default:
      // Unsupported ScaleMode ordinal. Force out-of-bounds so broken modes fail visibly at runtime.
      return float2(-1.0f);
  }

  // Apply the inverse rotation first, then the mirror, to map output->input.
  // `isMirrored` mirrors the rotated buffer (matching UIImage orientation
  // flag semantics, e.g. `.rightMirrored`), so when mapping backwards from
  // the upright output the mirror has to be undone after the rotation.
  int inverseRotation = (360 - normalizedRotation) % 360;

  switch (inverseRotation) {
    case 90:  // counter-rotate +90°
      coordinate = float2(1.0f - coordinate.y, coordinate.x);
      break;
    case 180:  // counter-rotate 180°
      coordinate = float2(1.0f - coordinate.x, 1.0f - coordinate.y);
      break;
    case 270:  // counter-rotate -90°
      coordinate = float2(coordinate.y, 1.0f - coordinate.x);
      break;
    default:  // 0°
      break;
  }

  if (uniforms.isMirrored != 0u) {
    coordinate.x = 1.0f - coordinate.x;
  }

  return coordinate;
}

inline float3 orderedColor(
  float3 rgb
) {
  switch (kChannelOrder) {
    case 0u: // 0u == ChannelOrder::RGB
      return rgb;
    case 1u: // 1u == ChannelOrder::BGR
      return rgb.bgr;
    default:
      // Unsupported ChannelOrder ordinal. Fall back to black so broken channel orders fail visibly at runtime.
      return float3(0.0f);
  }
}

inline uint outputIndex(
  uint2 gid,
  uint channelIndex,
  constant ResizeUniforms& uniforms
) {
  uint pixelIndex = (gid.y * uniforms.outputWidth) + gid.x;
  uint pixelCount = uniforms.outputWidth * uniforms.outputHeight;

  switch (kPixelLayout) {
    case 0u: // 0u == PixelLayout::INTERLEAVED == HWC / NHWC
      return (pixelIndex * kChannelCount) + channelIndex;
    case 1u: // 1u == PixelLayout::PLANAR == CHW / NCHW
      return (channelIndex * pixelCount) + pixelIndex;
    default:
      // Unsupported PixelLayout ordinal. Fall back to index 0 so broken layouts fail visibly at runtime.
      return 0u;
  }
}

inline void writeChannel(device uchar* output, uint index, float value) {
  int quantized = int(rint(value * 255.0f));
  output[index] = uchar(clamp(quantized, 0, 255));
}

inline void writeChannel(device char* output, uint index, float value) {
  int quantized = int(rint(value * 255.0f)) - 128;
  output[index] = char(clamp(quantized, -128, 127));
}

inline void writeChannel(device half* output, uint index, float value) {
  output[index] = half(value);
}

inline void writeChannel(device float* output, uint index, float value) {
  output[index] = value;
}

/**
 * Writes one resized pixel into the output buffer, applying the configured
 * channel order, pixel layout and output data type.
 */
template <typename T>
inline void writeOrderedColor(
  float3 rgb,
  uint2 gid,
  constant ResizeUniforms& uniforms,
  device T* output
) {
  float3 ordered = orderedColor(rgb);
  for (uint channelIndex = 0u; channelIndex < kChannelCount; channelIndex++) {
    uint index = outputIndex(gid, channelIndex, uniforms);
    writeChannel(output, index, ordered[channelIndex]);
  }
}

// MARK: Input parsing - YUV 4:2:0 bi-planar

inline float3 yuvToRgb(float y, float2 uv) {
  float cb = uv.x - 0.5f;
  float cr = uv.y - 0.5f;

  float r = y + 1.402f * cr;
  float g = y - 0.344136f * cb - 0.714136f * cr;
  float b = y + 1.772f * cb;

  return clamp(float3(r, g, b), 0.0f, 1.0f);
}

inline float3 sampleYuv(
  texture2d<float, access::sample> yTexture,
  texture2d<float, access::sample> uvTexture,
  uint2 gid,
  constant ResizeUniforms& uniforms
) {
  float2 sourceSize = float2(yTexture.get_width(), yTexture.get_height());
  float2 coordinate = outputToInputCoordinate(gid, sourceSize, uniforms);
  if (coordinate.x < 0.0f) {
    return float3(0.0f);
  }

  float y = yTexture.sample(resizeSampler, coordinate).r;
  float2 uv = uvTexture.sample(resizeSampler, coordinate).rg;
  return yuvToRgb(y, uv);
}

// MARK: Input parsing - BGRA

inline float3 sampleBgra(
  texture2d<float, access::sample> bgraTexture,
  uint2 gid,
  constant ResizeUniforms& uniforms
) {
  float2 sourceSize = float2(bgraTexture.get_width(), bgraTexture.get_height());
  float2 coordinate = outputToInputCoordinate(gid, sourceSize, uniforms);
  if (coordinate.x < 0.0f) {
    return float3(0.0f);
  }

  // Metal returns sampled channels semantically, so `.rgb` already is
  // (r, g, b) - no swizzle or conversion needed.
  return clamp(bgraTexture.sample(resizeSampler, coordinate).rgb, 0.0f, 1.0f);
}

// MARK: Kernels - YUV 4:2:0 bi-planar input

kernel void resize_yuv_uint8(
  texture2d<float, access::sample> yTexture [[texture(0)]],
  texture2d<float, access::sample> uvTexture [[texture(1)]],
  device uchar* output [[buffer(0)]],
  constant ResizeUniforms& uniforms [[buffer(1)]],
  uint2 gid [[thread_position_in_grid]]
) {
  if (gid.x >= uniforms.outputWidth || gid.y >= uniforms.outputHeight) {
    return;
  }
  float3 rgb = sampleYuv(yTexture, uvTexture, gid, uniforms);
  writeOrderedColor(rgb, gid, uniforms, output);
}

kernel void resize_yuv_int8(
  texture2d<float, access::sample> yTexture [[texture(0)]],
  texture2d<float, access::sample> uvTexture [[texture(1)]],
  device char* output [[buffer(0)]],
  constant ResizeUniforms& uniforms [[buffer(1)]],
  uint2 gid [[thread_position_in_grid]]
) {
  if (gid.x >= uniforms.outputWidth || gid.y >= uniforms.outputHeight) {
    return;
  }
  float3 rgb = sampleYuv(yTexture, uvTexture, gid, uniforms);
  writeOrderedColor(rgb, gid, uniforms, output);
}

kernel void resize_yuv_float16(
  texture2d<float, access::sample> yTexture [[texture(0)]],
  texture2d<float, access::sample> uvTexture [[texture(1)]],
  device half* output [[buffer(0)]],
  constant ResizeUniforms& uniforms [[buffer(1)]],
  uint2 gid [[thread_position_in_grid]]
) {
  if (gid.x >= uniforms.outputWidth || gid.y >= uniforms.outputHeight) {
    return;
  }
  float3 rgb = sampleYuv(yTexture, uvTexture, gid, uniforms);
  writeOrderedColor(rgb, gid, uniforms, output);
}

kernel void resize_yuv_float32(
  texture2d<float, access::sample> yTexture [[texture(0)]],
  texture2d<float, access::sample> uvTexture [[texture(1)]],
  device float* output [[buffer(0)]],
  constant ResizeUniforms& uniforms [[buffer(1)]],
  uint2 gid [[thread_position_in_grid]]
) {
  if (gid.x >= uniforms.outputWidth || gid.y >= uniforms.outputHeight) {
    return;
  }
  float3 rgb = sampleYuv(yTexture, uvTexture, gid, uniforms);
  writeOrderedColor(rgb, gid, uniforms, output);
}

// MARK: Kernels - BGRA input

kernel void resize_bgra_uint8(
  texture2d<float, access::sample> bgraTexture [[texture(0)]],
  device uchar* output [[buffer(0)]],
  constant ResizeUniforms& uniforms [[buffer(1)]],
  uint2 gid [[thread_position_in_grid]]
) {
  if (gid.x >= uniforms.outputWidth || gid.y >= uniforms.outputHeight) {
    return;
  }
  float3 rgb = sampleBgra(bgraTexture, gid, uniforms);
  writeOrderedColor(rgb, gid, uniforms, output);
}

kernel void resize_bgra_int8(
  texture2d<float, access::sample> bgraTexture [[texture(0)]],
  device char* output [[buffer(0)]],
  constant ResizeUniforms& uniforms [[buffer(1)]],
  uint2 gid [[thread_position_in_grid]]
) {
  if (gid.x >= uniforms.outputWidth || gid.y >= uniforms.outputHeight) {
    return;
  }
  float3 rgb = sampleBgra(bgraTexture, gid, uniforms);
  writeOrderedColor(rgb, gid, uniforms, output);
}

kernel void resize_bgra_float16(
  texture2d<float, access::sample> bgraTexture [[texture(0)]],
  device half* output [[buffer(0)]],
  constant ResizeUniforms& uniforms [[buffer(1)]],
  uint2 gid [[thread_position_in_grid]]
) {
  if (gid.x >= uniforms.outputWidth || gid.y >= uniforms.outputHeight) {
    return;
  }
  float3 rgb = sampleBgra(bgraTexture, gid, uniforms);
  writeOrderedColor(rgb, gid, uniforms, output);
}

kernel void resize_bgra_float32(
  texture2d<float, access::sample> bgraTexture [[texture(0)]],
  device float* output [[buffer(0)]],
  constant ResizeUniforms& uniforms [[buffer(1)]],
  uint2 gid [[thread_position_in_grid]]
) {
  if (gid.x >= uniforms.outputWidth || gid.y >= uniforms.outputHeight) {
    return;
  }
  float3 rgb = sampleBgra(bgraTexture, gid, uniforms);
  writeOrderedColor(rgb, gid, uniforms, output);
}
