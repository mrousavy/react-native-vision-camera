import type { TargetDynamicRange } from '../specs/common-types/DynamicRange'

/**
 * Common Dynamic Ranges for the Camera.
 */
export const CommonDynamicRanges = {
  /**
   * Any SDR profile, preferrably 8-bit sRGB.
   */
  ANY_SDR: {
    bitDepth: 'sdr-8-bit',
    colorSpace: 'srgb',
    colorRange: 'full',
  },
  /**
   * Any HDR profile, preferrably 10-bit HLG_BT2020.
   */
  ANY_HDR: {
    bitDepth: 'hdr-10-bit',
    colorSpace: 'hlg-bt2020',
    colorRange: 'full',
  },
} as const satisfies Record<string, TargetDynamicRange>
