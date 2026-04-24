import type { Size } from '../specs/common-types/Size'

/**
 * Common camera-centric resolution targets.
 *
 * 16:9 entries follow standard video tiers.
 * 4:3 entries intentionally use common photo/sensor output sizes
 * instead of mathematically scaling the 16:9 tiers, because actual
 * camera formats are usually exposed in sensor-native 4:3 steps.
 */
export const CommonResolutions = {
  /**
   * VGA (480p) Resolution in 16:9 aspect ratio.
   */
  VGA_16_9: { width: 480, height: 854 },
  /**
   * VGA (480p) Resolution in 4:3 aspect ratio.
   */
  VGA_4_3: { width: 480, height: 640 },
  /**
   * HD (720p) Resolution in 16:9 aspect ratio.
   */
  HD_16_9: { width: 720, height: 1280 },
  /**
   * Common low-resolution 4:3 camera target.
   */
  HD_4_3: { width: 768, height: 1024 },
  /**
   * Full-HD (1080p) Resolution in 16:9 aspect ratio.
   */
  FHD_16_9: { width: 1080, height: 1920 },
  /**
   * Common 4:3 camera target around the Full-HD tier.
   */
  FHD_4_3: { width: 1440, height: 1920 },
  /**
   * Quad-HD (1440p) Resolution in 16:9 aspect ratio.
   */
  QHD_16_9: { width: 1440, height: 2560 },
  /**
   * Common 4:3 camera target around the Quad-HD tier.
   */
  QHD_4_3: { width: 1944, height: 2592 },
  /**
   * Ultra-HD (4k) Resolution in 16:9 aspect ratio.
   */
  UHD_16_9: { width: 2160, height: 3840 },
  /**
   * Common high-resolution 4:3 photo target.
   */
  UHD_4_3: { width: 3024, height: 4032 },
  /**
   * 8k Resolution in 16:9 aspect ratio.
   */
  '8k_16_9': { width: 4536, height: 8064 },
  /**
   * 8k Resolution in 4:3 aspect ratio.
   */
  '8k_4_3': { width: 6048, height: 8064 },

  /**
   * The lowest possible resolution in 16:9 aspect ratio.
   * Useful when you want the smallest/fastest capture.
   */
  LOWEST_16_9: { width: 9, height: 16 },
  /**
   * The lowest possible resolution in 4:3 aspect ratio.
   * Useful when you want the smallest/fastest capture.
   */
  LOWEST_4_3: { width: 3, height: 4 },
  /**
   * The highest possible resolution in 16:9 aspect ratio.
   * Useful when you want the maximum available quality.
   */
  HIGHEST_16_9: { width: 9000, height: 16000 },
  /**
   * The highest possible resolution in 4:3 aspect ratio.
   * Useful when you want the maximum available quality.
   */
  HIGHEST_4_3: { width: 30000, height: 40000 },
} as const satisfies Record<string, Size>
