///
/// VulkanResizerPipeline.hpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#pragma once

#include "ResizerOptions.hpp"
#include "utils/OutputBufferLayout.hpp"
#include "vulkan/VulkanBufferView.hpp"
#include "vulkan/VulkanDynamicDispatch.hpp"
#include "vulkan/VulkanHardwareBufferInterop.hpp"
#include "vulkan/VulkanPhysicalDeviceSelector.hpp"
#include "vulkan/VulkanReusableBuffer.hpp"

#include <android/hardware_buffer.h>
#include <array>
#include <cstddef>
#include <cstdint>
#include <limits>
#include <memory>
#include <mutex>

#include <vulkan/vulkan.h>
#include <vulkan/vulkan_android.h>

#if __ANDROID_API__ < 26
#error VisionCameraResizer requires Android API 26 or higher for AHardwareBuffer support.
#endif

namespace margelo::nitro::camera::resizer::vulkan {

/**
 * Owns the Vulkan resources needed to resize and convert frames into one reusable output buffer.
 */
class VulkanResizerPipeline final {
public:
  /**
   * Builds a Vulkan pipeline for one fixed output size and output layout.
   */
  explicit VulkanResizerPipeline(const ResizerOptions& options);
  ~VulkanResizerPipeline();

  VulkanResizerPipeline(const VulkanResizerPipeline&) = delete;
  VulkanResizerPipeline& operator=(const VulkanResizerPipeline&) = delete;

  /**
   * Imports one AHardwareBuffer, runs the compute shader, and returns a view over the reusable output buffer.
   *
   * @throws If the input buffer is invalid, Vulkan support is incomplete, or a previous output view is still alive.
   */
  [[nodiscard]] std::shared_ptr<VulkanBufferView> run(AHardwareBuffer* hardwareBuffer, int rotationDegrees, bool isMirrored);
  /**
   * Reports whether a live GPU frame is still holding the reusable output buffer.
   */
  [[nodiscard]] bool hasActiveOutputView() const noexcept;
  /**
   * Reports how much native memory is pinned by the persistent Vulkan output allocation.
   */
  [[nodiscard]] size_t getOutputBufferAllocationSize() const noexcept;
  /**
   * Returns whether the required Vulkan capabilities for the GPU resizer pipeline
   * are available on this device.
   */
  [[nodiscard]] static bool isSupported() noexcept;

private:
  static inline constexpr uint32_t kWorkgroupSizeX = 8;
  static inline constexpr uint32_t kWorkgroupSizeY = 8;
  static inline constexpr size_t kStorageBufferAlignment = sizeof(uint32_t);
  static inline constexpr std::array<const char*, 2> kRequiredDeviceExtensions = {
      VK_ANDROID_EXTERNAL_MEMORY_ANDROID_HARDWARE_BUFFER_EXTENSION_NAME,
      VK_EXT_QUEUE_FAMILY_FOREIGN_EXTENSION_NAME,
  };

  /**
   * Vulkan objects that depend on the sampled external format of the current input buffer.
   */
  struct ComputeResources final {
    uint64_t externalFormat{0};
    VkSamplerYcbcrConversion conversion{VK_NULL_HANDLE};
    VkSampler sampler{VK_NULL_HANDLE};
    VkDescriptorSetLayout descriptorSetLayout{VK_NULL_HANDLE};
    VkPipelineLayout pipelineLayout{VK_NULL_HANDLE};
    VkPipeline pipeline{VK_NULL_HANDLE};
    VkDescriptorPool descriptorPool{VK_NULL_HANDLE};
    VkDescriptorSet descriptorSet{VK_NULL_HANDLE};
  };

  void createInstance();
  void createDevice();
  void createCommandResources();
  void createShaderModule();
  void createOutputBuffer();
  void createComputeResourcesLocked(const VulkanHardwareBufferInterop::Properties& formatProperties);
  void updateInputDescriptorLocked(const VulkanHardwareBufferInterop::ImportedImage& inputImage);
  void recordCommandBufferLocked(const VulkanHardwareBufferInterop::ImportedImage& inputImage, int rotationDegrees, bool isMirrored);
  void submitAndWaitLocked();
  void invalidateOutputBufferIfNeededLocked();
  void destroyComputeResourcesLocked() noexcept;
  void destroyOutputBufferLocked() noexcept;
  void destroyLocked() noexcept;

  [[nodiscard]] uint32_t getOutputWidth() const noexcept;
  [[nodiscard]] uint32_t getOutputHeight() const noexcept;
  [[nodiscard]] size_t getOutputByteCount() const;
  [[nodiscard]] size_t getStorageBufferByteCount() const;

private:
  // Protects the reused Vulkan execution state: queue, command buffer, descriptors, compute resources, and output buffer.
  mutable std::mutex _stateMutex;
  ResizerOptions _options{};

  VkInstance _instance{VK_NULL_HANDLE};
  VkPhysicalDevice _physicalDevice{VK_NULL_HANDLE};
  VkDevice _device{VK_NULL_HANDLE};
  VulkanInstanceDispatch _instanceDispatch{};
  VulkanDeviceDispatch _deviceDispatch{};
  uint32_t _queueFamilyIndex{std::numeric_limits<uint32_t>::max()};
  VkQueue _queue{VK_NULL_HANDLE};
  VkCommandPool _commandPool{VK_NULL_HANDLE};
  VkCommandBuffer _commandBuffer{VK_NULL_HANDLE};
  VkFence _fence{VK_NULL_HANDLE};
  VkShaderModule _shaderModule{VK_NULL_HANDLE};

  std::unique_ptr<VulkanReusableBuffer> _outputBuffer;
  std::unique_ptr<VulkanHardwareBufferInterop> _hardwareBufferInterop;
  ComputeResources _computeResources{};
};

} // namespace margelo::nitro::camera::resizer::vulkan
