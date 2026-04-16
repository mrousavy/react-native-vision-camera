///
/// VulkanResizerPipeline.cpp
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

#include "vulkan/VulkanResizerPipeline.hpp"

#include "vulkan/VulkanResizerShaderConfig.hpp"
#include "vulkan/VulkanShaderAssetLoader.hpp"
#include "vulkan/VulkanUtils.hpp"

#include <cmath>
#include <limits>
#include <stdexcept>

namespace margelo::nitro::camera::resizer::vulkan {

bool VulkanResizerPipeline::isSupported() noexcept {
  VkInstance instance = VK_NULL_HANDLE;
  try {
    VkApplicationInfo applicationInfo{
        .sType = VK_STRUCTURE_TYPE_APPLICATION_INFO,
        .pNext = nullptr,
        .pApplicationName = "VisionCameraResizer",
        .applicationVersion = VK_MAKE_VERSION(1, 0, 0),
        .pEngineName = "VisionCameraResizer",
        .engineVersion = VK_MAKE_VERSION(1, 0, 0),
        .apiVersion = VK_API_VERSION_1_1,
    };

    VkInstanceCreateInfo instanceCreateInfo{
        .sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO,
        .pNext = nullptr,
        .flags = 0,
        .pApplicationInfo = &applicationInfo,
        .enabledLayerCount = 0,
        .ppEnabledLayerNames = nullptr,
        .enabledExtensionCount = 0,
        .ppEnabledExtensionNames = nullptr,
    };

    utils::checkVk(vkCreateInstance(&instanceCreateInfo, nullptr, &instance), "Failed to create a Vulkan instance.");
    const VulkanInstanceDispatch instanceDispatch = VulkanInstanceDispatch::load(instance);
    const physical_device_selector::Selection selection = physical_device_selector::select(instance, instanceDispatch, kRequiredDeviceExtensions);
    if (selection.physicalDevice == VK_NULL_HANDLE) {
      return false;
    }

    vkDestroyInstance(instance, nullptr);
    return true;
  } catch (...) {
    if (instance != VK_NULL_HANDLE) {
      vkDestroyInstance(instance, nullptr);
    }
    return false;
  }
}

VulkanResizerPipeline::VulkanResizerPipeline(const ResizerOptions& options) : _options(options) {
  try {
    std::lock_guard<std::mutex> lock(_stateMutex);
    // Build the reusable Vulkan objects once. Per-frame input imports happen later in run().
    createInstance();
    createDevice();
    createCommandResources();
    createShaderModule();
    createOutputBuffer();
  } catch (...) {
    std::lock_guard<std::mutex> lock(_stateMutex);
    destroyLocked();
    throw;
  }
}

VulkanResizerPipeline::~VulkanResizerPipeline() {
  std::lock_guard<std::mutex> lock(_stateMutex);
  destroyLocked();
}

std::shared_ptr<VulkanBufferView> VulkanResizerPipeline::run(AHardwareBuffer* hardwareBuffer, int rotationDegrees, bool isMirrored) {
  if (hardwareBuffer == nullptr) [[unlikely]] {
    throw std::runtime_error("Input AHardwareBuffer is null.");
  }

  AHardwareBuffer_Desc description{};
  AHardwareBuffer_describe(hardwareBuffer, &description);
  if (description.width == 0 || description.height == 0) [[unlikely]] {
    throw std::runtime_error("Input AHardwareBuffer has invalid dimensions.");
  }
  if (description.format == AHARDWAREBUFFER_FORMAT_BLOB) [[unlikely]] {
    throw std::runtime_error("AHardwareBuffer format BLOB cannot be sampled from Vulkan.");
  }

  std::lock_guard<std::mutex> lock(_stateMutex);
  if (_instance == VK_NULL_HANDLE) [[unlikely]] {
    throw std::runtime_error("This Resizer has already been disposed.");
  }

  // The pipeline reuses one mapped output buffer, so only one GPUFrame may be alive at a time.
  std::shared_ptr<VulkanBufferView> outputBufferView =
      _outputBuffer->acquireView(getOutputWidth(), getOutputHeight(), _options.channelOrder, _options.dataType, _options.pixelLayout, getOutputByteCount());

  const VulkanHardwareBufferInterop::Properties properties = _hardwareBufferInterop->queryProperties(hardwareBuffer);
  // Rebuild the sampler and descriptor state if this input uses a different external Vulkan format.
  createComputeResourcesLocked(properties);

  // Wrap this frame's AHardwareBuffer in temporary Vulkan image objects for a single compute dispatch.
  const VulkanHardwareBufferInterop::ImportedImage& inputImage =
      _hardwareBufferInterop->importImage(hardwareBuffer, description, properties, _computeResources.conversion);

  updateInputDescriptorLocked(inputImage);
  recordCommandBufferLocked(inputImage, rotationDegrees, isMirrored);
  submitAndWaitLocked();
  invalidateOutputBufferIfNeededLocked();

  return outputBufferView;
}

bool VulkanResizerPipeline::hasActiveOutputView() const noexcept {
  std::lock_guard<std::mutex> lock(_stateMutex);
  if (_instance == VK_NULL_HANDLE || _outputBuffer == nullptr) {
    return false;
  }
  return _outputBuffer->isInUse();
}

size_t VulkanResizerPipeline::getOutputBufferAllocationSize() const noexcept {
  std::lock_guard<std::mutex> lock(_stateMutex);
  if (_instance == VK_NULL_HANDLE || _outputBuffer == nullptr) {
    return 0;
  }
  return _outputBuffer->getAllocationSize();
}

void VulkanResizerPipeline::createInstance() {
  VkApplicationInfo applicationInfo{
      .sType = VK_STRUCTURE_TYPE_APPLICATION_INFO,
      .pNext = nullptr,
      .pApplicationName = "VisionCameraResizer",
      .applicationVersion = VK_MAKE_VERSION(1, 0, 0),
      .pEngineName = "VisionCameraResizer",
      .engineVersion = VK_MAKE_VERSION(1, 0, 0),
      .apiVersion = VK_API_VERSION_1_1,
  };

  VkInstanceCreateInfo instanceCreateInfo{
      .sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO,
      .pNext = nullptr,
      .flags = 0,
      .pApplicationInfo = &applicationInfo,
      .enabledLayerCount = 0,
      .ppEnabledLayerNames = nullptr,
      .enabledExtensionCount = 0,
      .ppEnabledExtensionNames = nullptr,
  };

  utils::checkVk(vkCreateInstance(&instanceCreateInfo, nullptr, &_instance), "Failed to create a Vulkan instance.");
  _instanceDispatch = VulkanInstanceDispatch::load(_instance);
}

void VulkanResizerPipeline::createDevice() {
  const physical_device_selector::Selection selection = physical_device_selector::select(_instance, _instanceDispatch, kRequiredDeviceExtensions);
  _physicalDevice = selection.physicalDevice;
  _queueFamilyIndex = selection.queueFamilyIndex;

  float queuePriority = 1.0f;
  VkDeviceQueueCreateInfo queueCreateInfo{
      .sType = VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO,
      .pNext = nullptr,
      .flags = 0,
      .queueFamilyIndex = _queueFamilyIndex,
      .queueCount = 1,
      .pQueuePriorities = &queuePriority,
  };

  VkPhysicalDeviceVulkan11Features vulkan11Features{};
  vulkan11Features.sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_VULKAN_1_1_FEATURES;
  vulkan11Features.samplerYcbcrConversion = VK_TRUE;

  VkPhysicalDeviceFeatures2 features2{
      .sType = VK_STRUCTURE_TYPE_PHYSICAL_DEVICE_FEATURES_2,
      .pNext = &vulkan11Features,
      .features = {},
  };

  VkDeviceCreateInfo deviceCreateInfo{
      .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
      .pNext = &features2,
      .flags = 0,
      .queueCreateInfoCount = 1,
      .pQueueCreateInfos = &queueCreateInfo,
      .enabledLayerCount = 0,
      .ppEnabledLayerNames = nullptr,
      .enabledExtensionCount = static_cast<uint32_t>(kRequiredDeviceExtensions.size()),
      .ppEnabledExtensionNames = kRequiredDeviceExtensions.data(),
      .pEnabledFeatures = nullptr,
  };

  utils::checkVk(vkCreateDevice(_physicalDevice, &deviceCreateInfo, nullptr, &_device), "Failed to create a Vulkan device.");
  _deviceDispatch = VulkanDeviceDispatch::load(_device);
  vkGetDeviceQueue(_device, _queueFamilyIndex, 0, &_queue);

  _hardwareBufferInterop = std::make_unique<VulkanHardwareBufferInterop>(_physicalDevice, _device, _deviceDispatch);
}

void VulkanResizerPipeline::createCommandResources() {
  VkCommandPoolCreateInfo commandPoolCreateInfo{
      .sType = VK_STRUCTURE_TYPE_COMMAND_POOL_CREATE_INFO,
      .pNext = nullptr,
      .flags = VK_COMMAND_POOL_CREATE_RESET_COMMAND_BUFFER_BIT,
      .queueFamilyIndex = _queueFamilyIndex,
  };

  utils::checkVk(vkCreateCommandPool(_device, &commandPoolCreateInfo, nullptr, &_commandPool), "Failed to create a Vulkan command pool.");

  VkCommandBufferAllocateInfo commandBufferAllocateInfo{
      .sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_ALLOCATE_INFO,
      .pNext = nullptr,
      .commandPool = _commandPool,
      .level = VK_COMMAND_BUFFER_LEVEL_PRIMARY,
      .commandBufferCount = 1,
  };

  utils::checkVk(vkAllocateCommandBuffers(_device, &commandBufferAllocateInfo, &_commandBuffer), "Failed to allocate a Vulkan command buffer.");

  VkFenceCreateInfo fenceCreateInfo{
      .sType = VK_STRUCTURE_TYPE_FENCE_CREATE_INFO,
      .pNext = nullptr,
      .flags = 0,
  };

  utils::checkVk(vkCreateFence(_device, &fenceCreateInfo, nullptr, &_fence), "Failed to create a Vulkan fence.");
}

void VulkanResizerPipeline::createShaderModule() {
  const std::vector<uint32_t>& shaderWords = getResizerComputeShaderSpirv();

  VkShaderModuleCreateInfo shaderModuleCreateInfo{
      .sType = VK_STRUCTURE_TYPE_SHADER_MODULE_CREATE_INFO,
      .pNext = nullptr,
      .flags = 0,
      .codeSize = shaderWords.size() * sizeof(uint32_t),
      .pCode = shaderWords.data(),
  };

  utils::checkVk(vkCreateShaderModule(_device, &shaderModuleCreateInfo, nullptr, &_shaderModule), "Failed to create the Vulkan resizer shader module.");
}

void VulkanResizerPipeline::createOutputBuffer() {
  const size_t storageBufferByteCount = getStorageBufferByteCount();
  _outputBuffer = std::make_unique<VulkanReusableBuffer>(_physicalDevice, _device, storageBufferByteCount);
}

void VulkanResizerPipeline::createComputeResourcesLocked(const VulkanHardwareBufferInterop::Properties& properties) {
  // Consecutive frames often share the same sampled external format, so the compute pipeline can be reused.
  if (_computeResources.externalFormat == properties.formatProperties.externalFormat) {
    return;
  }

  // Cached imported image views are tied to the previous conversion object and must be rebuilt with the new one.
  _hardwareBufferInterop->clearCachedImages();
  destroyComputeResourcesLocked();

  try {
    VkExternalFormatANDROID externalFormatInfo{};
    externalFormatInfo.sType = VK_STRUCTURE_TYPE_EXTERNAL_FORMAT_ANDROID;
    externalFormatInfo.externalFormat = properties.formatProperties.externalFormat;

    VkSamplerYcbcrConversionCreateInfo conversionCreateInfo{};
    conversionCreateInfo.sType = VK_STRUCTURE_TYPE_SAMPLER_YCBCR_CONVERSION_CREATE_INFO;
    conversionCreateInfo.pNext = &externalFormatInfo;
    conversionCreateInfo.format = VK_FORMAT_UNDEFINED;
    conversionCreateInfo.ycbcrModel = properties.formatProperties.suggestedYcbcrModel;
    conversionCreateInfo.ycbcrRange = properties.formatProperties.suggestedYcbcrRange;
    conversionCreateInfo.components = properties.formatProperties.samplerYcbcrConversionComponents;
    conversionCreateInfo.xChromaOffset = properties.formatProperties.suggestedXChromaOffset;
    conversionCreateInfo.yChromaOffset = properties.formatProperties.suggestedYChromaOffset;
    conversionCreateInfo.chromaFilter = VK_FILTER_LINEAR;
    conversionCreateInfo.forceExplicitReconstruction = VK_FALSE;

    utils::checkVk(_deviceDispatch.createSamplerYcbcrConversion(_device, &conversionCreateInfo, nullptr, &_computeResources.conversion),
                   "Failed to create the Vulkan YCbCr conversion for the input AHardwareBuffer.");

    VkSamplerYcbcrConversionInfo samplerConversionInfo{};
    samplerConversionInfo.sType = VK_STRUCTURE_TYPE_SAMPLER_YCBCR_CONVERSION_INFO;
    samplerConversionInfo.conversion = _computeResources.conversion;

    VkSamplerCreateInfo samplerCreateInfo{};
    samplerCreateInfo.sType = VK_STRUCTURE_TYPE_SAMPLER_CREATE_INFO;
    samplerCreateInfo.pNext = &samplerConversionInfo;
    samplerCreateInfo.magFilter = VK_FILTER_LINEAR;
    samplerCreateInfo.minFilter = VK_FILTER_LINEAR;
    samplerCreateInfo.mipmapMode = VK_SAMPLER_MIPMAP_MODE_NEAREST;
    samplerCreateInfo.addressModeU = VK_SAMPLER_ADDRESS_MODE_CLAMP_TO_EDGE;
    samplerCreateInfo.addressModeV = VK_SAMPLER_ADDRESS_MODE_CLAMP_TO_EDGE;
    samplerCreateInfo.addressModeW = VK_SAMPLER_ADDRESS_MODE_CLAMP_TO_EDGE;
    samplerCreateInfo.mipLodBias = 0.0f;
    samplerCreateInfo.anisotropyEnable = VK_FALSE;
    samplerCreateInfo.compareEnable = VK_FALSE;
    samplerCreateInfo.minLod = 0.0f;
    samplerCreateInfo.maxLod = 0.0f;
    samplerCreateInfo.borderColor = VK_BORDER_COLOR_FLOAT_TRANSPARENT_BLACK;
    samplerCreateInfo.unnormalizedCoordinates = VK_FALSE;

    utils::checkVk(vkCreateSampler(_device, &samplerCreateInfo, nullptr, &_computeResources.sampler),
                   "Failed to create the Vulkan sampler for the input AHardwareBuffer.");

    VkDescriptorSetLayoutBinding inputBinding{};
    inputBinding.binding = 0;
    inputBinding.descriptorType = VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER;
    inputBinding.descriptorCount = 1;
    inputBinding.stageFlags = VK_SHADER_STAGE_COMPUTE_BIT;
    inputBinding.pImmutableSamplers = &_computeResources.sampler;

    VkDescriptorSetLayoutBinding outputBinding{};
    outputBinding.binding = 1;
    outputBinding.descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER;
    outputBinding.descriptorCount = 1;
    outputBinding.stageFlags = VK_SHADER_STAGE_COMPUTE_BIT;

    const std::array<VkDescriptorSetLayoutBinding, 2> bindings = {inputBinding, outputBinding};

    VkDescriptorSetLayoutCreateInfo descriptorSetLayoutCreateInfo{};
    descriptorSetLayoutCreateInfo.sType = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_LAYOUT_CREATE_INFO;
    descriptorSetLayoutCreateInfo.bindingCount = static_cast<uint32_t>(bindings.size());
    descriptorSetLayoutCreateInfo.pBindings = bindings.data();

    utils::checkVk(vkCreateDescriptorSetLayout(_device, &descriptorSetLayoutCreateInfo, nullptr, &_computeResources.descriptorSetLayout),
                   "Failed to create the Vulkan descriptor set layout for the resizer pipeline.");

    VkPushConstantRange pushConstantRange{};
    pushConstantRange.stageFlags = VK_SHADER_STAGE_COMPUTE_BIT;
    pushConstantRange.offset = 0;
    pushConstantRange.size = sizeof(shader_config::ShaderPushConstants);

    VkPipelineLayoutCreateInfo pipelineLayoutCreateInfo{};
    pipelineLayoutCreateInfo.sType = VK_STRUCTURE_TYPE_PIPELINE_LAYOUT_CREATE_INFO;
    pipelineLayoutCreateInfo.setLayoutCount = 1;
    pipelineLayoutCreateInfo.pSetLayouts = &_computeResources.descriptorSetLayout;
    pipelineLayoutCreateInfo.pushConstantRangeCount = 1;
    pipelineLayoutCreateInfo.pPushConstantRanges = &pushConstantRange;

    utils::checkVk(vkCreatePipelineLayout(_device, &pipelineLayoutCreateInfo, nullptr, &_computeResources.pipelineLayout),
                   "Failed to create the Vulkan resizer pipeline layout.");

    VkPipelineShaderStageCreateInfo shaderStageCreateInfo{};
    shaderStageCreateInfo.sType = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO;
    shaderStageCreateInfo.stage = VK_SHADER_STAGE_COMPUTE_BIT;
    shaderStageCreateInfo.module = _shaderModule;
    shaderStageCreateInfo.pName = "main";
    const shader_config::ShaderSpecializationData specializationData = shader_config::ShaderSpecializationData::make(_options);
    const VkSpecializationInfo vkSpecializationInfo = specializationData.asVkInfo();
    // ResizerOptions are fixed for the lifetime of this VulkanResizerPipeline, so specialize the shader once when building the pipeline.
    shaderStageCreateInfo.pSpecializationInfo = &vkSpecializationInfo;

    VkComputePipelineCreateInfo computePipelineCreateInfo{};
    computePipelineCreateInfo.sType = VK_STRUCTURE_TYPE_COMPUTE_PIPELINE_CREATE_INFO;
    computePipelineCreateInfo.stage = shaderStageCreateInfo;
    computePipelineCreateInfo.layout = _computeResources.pipelineLayout;

    utils::checkVk(vkCreateComputePipelines(_device, VK_NULL_HANDLE, 1, &computePipelineCreateInfo, nullptr, &_computeResources.pipeline),
                   "Failed to create the Vulkan resizer compute pipeline.");

    const std::array<VkDescriptorPoolSize, 2> poolSizes = {
        VkDescriptorPoolSize{VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER, 1},
        VkDescriptorPoolSize{VK_DESCRIPTOR_TYPE_STORAGE_BUFFER, 1},
    };

    VkDescriptorPoolCreateInfo descriptorPoolCreateInfo{};
    descriptorPoolCreateInfo.sType = VK_STRUCTURE_TYPE_DESCRIPTOR_POOL_CREATE_INFO;
    descriptorPoolCreateInfo.maxSets = 1;
    descriptorPoolCreateInfo.poolSizeCount = static_cast<uint32_t>(poolSizes.size());
    descriptorPoolCreateInfo.pPoolSizes = poolSizes.data();

    utils::checkVk(vkCreateDescriptorPool(_device, &descriptorPoolCreateInfo, nullptr, &_computeResources.descriptorPool),
                   "Failed to create the Vulkan descriptor pool for the resizer pipeline.");

    VkDescriptorSetAllocateInfo descriptorSetAllocateInfo{};
    descriptorSetAllocateInfo.sType = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_ALLOCATE_INFO;
    descriptorSetAllocateInfo.descriptorPool = _computeResources.descriptorPool;
    descriptorSetAllocateInfo.descriptorSetCount = 1;
    descriptorSetAllocateInfo.pSetLayouts = &_computeResources.descriptorSetLayout;

    utils::checkVk(vkAllocateDescriptorSets(_device, &descriptorSetAllocateInfo, &_computeResources.descriptorSet),
                   "Failed to allocate the Vulkan descriptor set for the resizer pipeline.");

    VkDescriptorBufferInfo outputBufferInfo{
        .buffer = _outputBuffer->getBuffer(),
        .offset = 0,
        .range = getStorageBufferByteCount(),
    };

    VkWriteDescriptorSet outputBufferWrite{
        .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
        .pNext = nullptr,
        .dstSet = _computeResources.descriptorSet,
        .dstBinding = 1,
        .dstArrayElement = 0,
        .descriptorCount = 1,
        .descriptorType = VK_DESCRIPTOR_TYPE_STORAGE_BUFFER,
        .pImageInfo = nullptr,
        .pBufferInfo = &outputBufferInfo,
        .pTexelBufferView = nullptr,
    };

    vkUpdateDescriptorSets(_device, 1, &outputBufferWrite, 0, nullptr);
    _computeResources.externalFormat = properties.formatProperties.externalFormat;
  } catch (...) {
    destroyComputeResourcesLocked();
    throw;
  }
}

void VulkanResizerPipeline::updateInputDescriptorLocked(const VulkanHardwareBufferInterop::ImportedImage& inputImage) {
  // Point the reusable descriptor set at this frame's imported image view.
  VkDescriptorImageInfo imageInfo{
      .sampler = VK_NULL_HANDLE,
      .imageView = inputImage.view,
      .imageLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL,
  };

  VkWriteDescriptorSet inputWrite{
      .sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
      .pNext = nullptr,
      .dstSet = _computeResources.descriptorSet,
      .dstBinding = 0,
      .dstArrayElement = 0,
      .descriptorCount = 1,
      .descriptorType = VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER,
      .pImageInfo = &imageInfo,
      .pBufferInfo = nullptr,
      .pTexelBufferView = nullptr,
  };

  vkUpdateDescriptorSets(_device, 1, &inputWrite, 0, nullptr);
}

void VulkanResizerPipeline::recordCommandBufferLocked(const VulkanHardwareBufferInterop::ImportedImage& inputImage, int rotationDegrees, bool isMirrored) {
  utils::checkVk(vkResetCommandBuffer(_commandBuffer, 0), "Failed to reset the Vulkan resizer command buffer.");

  VkCommandBufferBeginInfo beginInfo{
      .sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO,
      .pNext = nullptr,
      .flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT,
      .pInheritanceInfo = nullptr,
  };

  utils::checkVk(vkBeginCommandBuffer(_commandBuffer, &beginInfo), "Failed to begin recording the Vulkan resizer command buffer.");

  // Acquire the camera buffer from its foreign owner before the compute shader samples it.
  VkImageMemoryBarrier acquireBarrier{};
  acquireBarrier.sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER;
  acquireBarrier.srcAccessMask = 0;
  acquireBarrier.dstAccessMask = VK_ACCESS_SHADER_READ_BIT;
  acquireBarrier.oldLayout = VK_IMAGE_LAYOUT_GENERAL;
  acquireBarrier.newLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL;
  acquireBarrier.srcQueueFamilyIndex = VK_QUEUE_FAMILY_FOREIGN_EXT;
  acquireBarrier.dstQueueFamilyIndex = _queueFamilyIndex;
  acquireBarrier.image = inputImage.image;
  acquireBarrier.subresourceRange.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
  acquireBarrier.subresourceRange.baseMipLevel = 0;
  acquireBarrier.subresourceRange.levelCount = 1;
  acquireBarrier.subresourceRange.baseArrayLayer = 0;
  acquireBarrier.subresourceRange.layerCount = 1;

  vkCmdPipelineBarrier(_commandBuffer, VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT, VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT, 0, 0, nullptr, 0, nullptr, 1, &acquireBarrier);

  vkCmdBindPipeline(_commandBuffer, VK_PIPELINE_BIND_POINT_COMPUTE, _computeResources.pipeline);
  vkCmdBindDescriptorSets(_commandBuffer, VK_PIPELINE_BIND_POINT_COMPUTE, _computeResources.pipelineLayout, 0, 1, &_computeResources.descriptorSet, 0, nullptr);

  // Push only the per-frame transform inputs; the fixed output contract is already specialized into the pipeline.
  const shader_config::ShaderPushConstants shaderPushConstants =
      shader_config::ShaderPushConstants::make(getOutputWidth(), getOutputHeight(), rotationDegrees, isMirrored);

  vkCmdPushConstants(_commandBuffer, _computeResources.pipelineLayout, VK_SHADER_STAGE_COMPUTE_BIT, 0, sizeof(shader_config::ShaderPushConstants),
                     &shaderPushConstants);

  // Zero the output buffer so sub-word atomicOr writes from adjacent pixels combine correctly.
  // FLOAT32 uses direct word stores and does not need this.
  if (_options.dataType != DataType::FLOAT32) {
    vkCmdFillBuffer(_commandBuffer, _outputBuffer->getBuffer(), 0, getStorageBufferByteCount(), 0);

    VkBufferMemoryBarrier fillBarrier{};
    fillBarrier.sType = VK_STRUCTURE_TYPE_BUFFER_MEMORY_BARRIER;
    fillBarrier.srcAccessMask = VK_ACCESS_TRANSFER_WRITE_BIT;
    fillBarrier.dstAccessMask = VK_ACCESS_SHADER_WRITE_BIT;
    fillBarrier.srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
    fillBarrier.dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
    fillBarrier.buffer = _outputBuffer->getBuffer();
    fillBarrier.offset = 0;
    fillBarrier.size = getStorageBufferByteCount();

    vkCmdPipelineBarrier(_commandBuffer, VK_PIPELINE_STAGE_TRANSFER_BIT, VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT, 0, 0, nullptr, 1, &fillBarrier, 0, nullptr);
  }

  vkCmdDispatch(_commandBuffer, utils::divideRoundUp(getOutputWidth(), kWorkgroupSizeX), utils::divideRoundUp(getOutputHeight(), kWorkgroupSizeY), 1);

  // Make the shader writes visible before JS reads the mapped output buffer.
  VkBufferMemoryBarrier outputBarrier{};
  outputBarrier.sType = VK_STRUCTURE_TYPE_BUFFER_MEMORY_BARRIER;
  outputBarrier.srcAccessMask = VK_ACCESS_SHADER_WRITE_BIT;
  outputBarrier.dstAccessMask = VK_ACCESS_HOST_READ_BIT;
  outputBarrier.srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
  outputBarrier.dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
  outputBarrier.buffer = _outputBuffer->getBuffer();
  outputBarrier.offset = 0;
  outputBarrier.size = getStorageBufferByteCount();

  vkCmdPipelineBarrier(_commandBuffer, VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT, VK_PIPELINE_STAGE_HOST_BIT, 0, 0, nullptr, 1, &outputBarrier, 0, nullptr);

  // Release the imported image back to the foreign owner once sampling is finished.
  VkImageMemoryBarrier releaseBarrier{};
  releaseBarrier.sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER;
  releaseBarrier.srcAccessMask = VK_ACCESS_SHADER_READ_BIT;
  releaseBarrier.dstAccessMask = 0;
  releaseBarrier.oldLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL;
  releaseBarrier.newLayout = VK_IMAGE_LAYOUT_GENERAL;
  releaseBarrier.srcQueueFamilyIndex = _queueFamilyIndex;
  releaseBarrier.dstQueueFamilyIndex = VK_QUEUE_FAMILY_FOREIGN_EXT;
  releaseBarrier.image = inputImage.image;
  releaseBarrier.subresourceRange.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
  releaseBarrier.subresourceRange.baseMipLevel = 0;
  releaseBarrier.subresourceRange.levelCount = 1;
  releaseBarrier.subresourceRange.baseArrayLayer = 0;
  releaseBarrier.subresourceRange.layerCount = 1;

  vkCmdPipelineBarrier(_commandBuffer, VK_PIPELINE_STAGE_COMPUTE_SHADER_BIT, VK_PIPELINE_STAGE_BOTTOM_OF_PIPE_BIT, 0, 0, nullptr, 0, nullptr, 1,
                       &releaseBarrier);

  utils::checkVk(vkEndCommandBuffer(_commandBuffer), "Failed to finish recording the Vulkan resizer command buffer.");
}

void VulkanResizerPipeline::submitAndWaitLocked() {
  utils::checkVk(vkResetFences(_device, 1, &_fence), "Failed to reset the Vulkan resizer fence.");

  VkSubmitInfo submitInfo{
      .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO,
      .pNext = nullptr,
      .waitSemaphoreCount = 0,
      .pWaitSemaphores = nullptr,
      .pWaitDstStageMask = nullptr,
      .commandBufferCount = 1,
      .pCommandBuffers = &_commandBuffer,
      .signalSemaphoreCount = 0,
      .pSignalSemaphores = nullptr,
  };

  utils::checkVk(vkQueueSubmit(_queue, 1, &submitInfo, _fence), "Failed to submit the Vulkan resizer command buffer.");
  utils::checkVk(vkWaitForFences(_device, 1, &_fence, VK_TRUE, std::numeric_limits<uint64_t>::max()),
                 "Failed to wait for the Vulkan resizer command buffer to complete.");
}

void VulkanResizerPipeline::invalidateOutputBufferIfNeededLocked() {
  if (!_outputBuffer->isHostCoherent()) {
    // Non-coherent mappings require an explicit invalidate before CPU or JS reads the finished pixels.
    VkMappedMemoryRange mappedMemoryRange{
        .sType = VK_STRUCTURE_TYPE_MAPPED_MEMORY_RANGE,
        .pNext = nullptr,
        .memory = _outputBuffer->getMemory(),
        .offset = 0,
        .size = VK_WHOLE_SIZE,
    };

    utils::checkVk(vkInvalidateMappedMemoryRanges(_device, 1, &mappedMemoryRange), "Failed to invalidate the Vulkan resizer output buffer mapping.");
  }
}

void VulkanResizerPipeline::destroyComputeResourcesLocked() noexcept {
  if (_device == VK_NULL_HANDLE) {
    // The device is already destroyed, so these handles can only be reset locally.
    _computeResources = ComputeResources{};
    return;
  }

  if (_computeResources.pipeline != VK_NULL_HANDLE) {
    vkDestroyPipeline(_device, _computeResources.pipeline, nullptr);
  }
  if (_computeResources.pipelineLayout != VK_NULL_HANDLE) {
    vkDestroyPipelineLayout(_device, _computeResources.pipelineLayout, nullptr);
  }
  if (_computeResources.descriptorPool != VK_NULL_HANDLE) {
    vkDestroyDescriptorPool(_device, _computeResources.descriptorPool, nullptr);
  }
  if (_computeResources.descriptorSetLayout != VK_NULL_HANDLE) {
    vkDestroyDescriptorSetLayout(_device, _computeResources.descriptorSetLayout, nullptr);
  }
  if (_computeResources.sampler != VK_NULL_HANDLE) {
    vkDestroySampler(_device, _computeResources.sampler, nullptr);
  }
  if (_computeResources.conversion != VK_NULL_HANDLE && _deviceDispatch.destroySamplerYcbcrConversion != nullptr) {
    _deviceDispatch.destroySamplerYcbcrConversion(_device, _computeResources.conversion, nullptr);
  }
  _computeResources = ComputeResources{};
}

void VulkanResizerPipeline::destroyOutputBufferLocked() noexcept {
  _outputBuffer.reset();
}

void VulkanResizerPipeline::destroyLocked() noexcept {
  if (_device != VK_NULL_HANDLE) {
    // Stop in-flight work before tearing down shared Vulkan objects in reverse ownership order.
    vkDeviceWaitIdle(_device);
  }

  destroyComputeResourcesLocked();
  destroyOutputBufferLocked();
  _hardwareBufferInterop.reset();

  if (_device != VK_NULL_HANDLE && _shaderModule != VK_NULL_HANDLE) {
    vkDestroyShaderModule(_device, _shaderModule, nullptr);
  }
  _shaderModule = VK_NULL_HANDLE;

  if (_device != VK_NULL_HANDLE && _fence != VK_NULL_HANDLE) {
    vkDestroyFence(_device, _fence, nullptr);
  }
  _fence = VK_NULL_HANDLE;

  if (_device != VK_NULL_HANDLE && _commandPool != VK_NULL_HANDLE) {
    vkDestroyCommandPool(_device, _commandPool, nullptr);
  }
  _commandPool = VK_NULL_HANDLE;
  _commandBuffer = VK_NULL_HANDLE;

  if (_device != VK_NULL_HANDLE) {
    vkDestroyDevice(_device, nullptr);
  }
  _device = VK_NULL_HANDLE;
  _deviceDispatch = VulkanDeviceDispatch{};
  _queueFamilyIndex = std::numeric_limits<uint32_t>::max();
  _queue = VK_NULL_HANDLE;
  _physicalDevice = VK_NULL_HANDLE;

  if (_instance != VK_NULL_HANDLE) {
    vkDestroyInstance(_instance, nullptr);
  }
  _instance = VK_NULL_HANDLE;
  _instanceDispatch = VulkanInstanceDispatch{};
}

uint32_t VulkanResizerPipeline::getOutputWidth() const noexcept {
  return static_cast<uint32_t>(std::lround(_options.width));
}

uint32_t VulkanResizerPipeline::getOutputHeight() const noexcept {
  return static_cast<uint32_t>(std::lround(_options.height));
}

size_t VulkanResizerPipeline::getOutputByteCount() const {
  // `pixelLayout` only changes how channel values are arranged in memory, not the total byte count.
  return margelo::nitro::camera::resizer::utils::getOutputTotalByteCount(_options.channelOrder, _options.dataType, getOutputWidth(), getOutputHeight());
}

size_t VulkanResizerPipeline::getStorageBufferByteCount() const {
  const size_t byteCount = getOutputByteCount();
  return ((byteCount + kStorageBufferAlignment - 1) / kStorageBufferAlignment) * kStorageBufferAlignment;
}

} // namespace margelo::nitro::camera::resizer::vulkan
