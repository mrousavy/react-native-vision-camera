/**
 * Represents a white balance setting expressed as a color temperature and tint offset.
 *
 * This is a human-friendly way of expressing white balance compared to raw
 * {@linkcode WhiteBalanceGains | per-channel gains}.
 *
 * @see {@linkcode WhiteBalanceGains}
 */
export interface WhiteBalanceTemperatureAndTint {
  /**
   * The color temperature in Kelvin (e.g. `5500` for daylight, `3200` for tungsten).
   */
  temperature: number
  /**
   * The green/magenta tint offset away from the temperature's black-body curve.
   * Positive values shift towards magenta, negative values shift towards green.
   */
  tint: number
}
