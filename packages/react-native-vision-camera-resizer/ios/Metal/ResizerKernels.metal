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
// 0u == ScaleMode::COVER, 1u == ScaleMode::CONTAIN
constant uint kScaleMode [[function_constant(3)]];

inline float3 yuvToRgb(float y, float2 uv) {
  float cb = uv.x - 0.5f;
  float cr = uv.y - 0.5f;

  float r = y + 1.402f * cr;
  float g = y - 0.344136f * cb - 0.714136f * cr;
  float b = y + 1.772f * cb;

  return clamp(float3(r, g, b), 0.0f, 1.0f);
}

inline float3 sampleRgb(
  texture2d<float, access::sample> yTexture,
  texture2d<float, access::sample> uvTexture,
  uint2 gid,
  constant ResizeUniforms& uniforms
) {
  float2 outputSize = float2(uniforms.outputWidth, uniforms.outputHeight);
  float2 sourceSize = float2(yTexture.get_width(), yTexture.get_height());
  float2 outputCoordinate = (float2(gid) + 0.5f) / outputSize;

  float scale = 0.0f;
  switch (kScaleMode) {
    case 0u: // 0u == ScaleMode::COVER
      scale = max(outputSize.x / sourceSize.x, outputSize.y / sourceSize.y);
      break;
    case 1u: // 1u == ScaleMode::CONTAIN
      scale = min(outputSize.x / sourceSize.x, outputSize.y / sourceSize.y);
      break;
    default:
      // Unsupported ScaleMode ordinal. Return black so broken modes fail visibly at runtime.
      return float3(0.0f);
  }

  float2 renderedSourceSizeInOutput = sourceSize * scale;
  float2 renderedSourceOffsetInOutput = (outputSize - renderedSourceSizeInOutput) * 0.5f;
  float2 coordinate = ((outputCoordinate * outputSize) - renderedSourceOffsetInOutput) / renderedSourceSizeInOutput;

  if (kScaleMode == 1u) {
    // Contain mode pads outside the rendered source with black bars.
    bool isOutsideSource = coordinate.x < 0.0f || coordinate.x > 1.0f || coordinate.y < 0.0f || coordinate.y > 1.0f;
    if (isOutsideSource) {
      return float3(0.0f);
    }
  }

  // Apply mirror first, then inverse rotation transform to map output->input.
  if (uniforms.isMirrored != 0u) {
    coordinate.x = 1.0f - coordinate.x;
  }

  int normalizedRotation = uniforms.rotationDegrees % 360;
  if (normalizedRotation < 0) {
    normalizedRotation += 360;
  }
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

  float y = yTexture.sample(resizeSampler, coordinate).r;
  float2 uv = uvTexture.sample(resizeSampler, coordinate).rg;
  return yuvToRgb(y, uv);
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

inline uchar quantizeUInt8(float value) {
  int quantized = int(rint(value * 255.0f));
  return uchar(clamp(quantized, 0, 255));
}

inline char quantizeInt8(float value) {
  int quantized = int(rint(value * 255.0f)) - 128;
  return char(clamp(quantized, -128, 127));
}

kernel void resize_uint8(
  texture2d<float, access::sample> yTexture [[texture(0)]],
  texture2d<float, access::sample> uvTexture [[texture(1)]],
  device uchar* output [[buffer(0)]],
  constant ResizeUniforms& uniforms [[buffer(1)]],
  uint2 gid [[thread_position_in_grid]]
) {
  if (gid.x >= uniforms.outputWidth || gid.y >= uniforms.outputHeight) {
    return;
  }

  float3 rgb = sampleRgb(yTexture, uvTexture, gid, uniforms);
  float3 ordered = orderedColor(rgb);

  for (uint channelIndex = 0u; channelIndex < kChannelCount; channelIndex++) {
    uint index = outputIndex(gid, channelIndex, uniforms);
    output[index] = quantizeUInt8(ordered[channelIndex]);
  }
}

kernel void resize_int8(
  texture2d<float, access::sample> yTexture [[texture(0)]],
  texture2d<float, access::sample> uvTexture [[texture(1)]],
  device char* output [[buffer(0)]],
  constant ResizeUniforms& uniforms [[buffer(1)]],
  uint2 gid [[thread_position_in_grid]]
) {
  if (gid.x >= uniforms.outputWidth || gid.y >= uniforms.outputHeight) {
    return;
  }

  float3 rgb = sampleRgb(yTexture, uvTexture, gid, uniforms);
  float3 ordered = orderedColor(rgb);

  for (uint channelIndex = 0u; channelIndex < kChannelCount; channelIndex++) {
    uint index = outputIndex(gid, channelIndex, uniforms);
    output[index] = quantizeInt8(ordered[channelIndex]);
  }
}

kernel void resize_float16(
  texture2d<float, access::sample> yTexture [[texture(0)]],
  texture2d<float, access::sample> uvTexture [[texture(1)]],
  device half* output [[buffer(0)]],
  constant ResizeUniforms& uniforms [[buffer(1)]],
  uint2 gid [[thread_position_in_grid]]
) {
  if (gid.x >= uniforms.outputWidth || gid.y >= uniforms.outputHeight) {
    return;
  }

  float3 rgb = sampleRgb(yTexture, uvTexture, gid, uniforms);
  float3 ordered = orderedColor(rgb);

  for (uint channelIndex = 0u; channelIndex < kChannelCount; channelIndex++) {
    uint index = outputIndex(gid, channelIndex, uniforms);
    output[index] = half(ordered[channelIndex]);
  }
}

kernel void resize_float32(
  texture2d<float, access::sample> yTexture [[texture(0)]],
  texture2d<float, access::sample> uvTexture [[texture(1)]],
  device float* output [[buffer(0)]],
  constant ResizeUniforms& uniforms [[buffer(1)]],
  uint2 gid [[thread_position_in_grid]]
) {
  if (gid.x >= uniforms.outputWidth || gid.y >= uniforms.outputHeight) {
    return;
  }

  float3 rgb = sampleRgb(yTexture, uvTexture, gid, uniforms);
  float3 ordered = orderedColor(rgb);

  for (uint channelIndex = 0u; channelIndex < kChannelCount; channelIndex++) {
    uint index = outputIndex(gid, channelIndex, uniforms);
    output[index] = ordered[channelIndex];
  }
}
