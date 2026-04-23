import type { WhiteBalanceTemperatureAndTint } from './WhiteBalanceTemperatureAndTint'

/**
 * Represents the per-channel gains applied for white balance correction.
 *
 * Each gain is a multiplier applied to the respective color channel in the
 * Camera's raw sensor data to achieve a neutral white point.
 *
 * @see {@linkcode WhiteBalanceTemperatureAndTint}
 */
export interface WhiteBalanceGains {
  /**
   * The gain applied to the red channel.
   */
  redGain: number
  /**
   * The gain applied to the blue channel.
   */
  blueGain: number
  /**
   * The gain applied to the green channel.
   */
  greenGain: number
}
