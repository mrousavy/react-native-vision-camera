/**
 * Specifies the prioritization between speed and quality for
 * photo capture.
 * - `'speed'`: Captures photos as fast as possible, possibly with zero-shutter-lag (ZSL).
 * - `'balanced'`: Usually the default, balances capture latency with quality.
 * - `'quality'`: Ensures photos are well exposed and allows enough time for maximum quality.
 */
export type QualityPrioritization = 'speed' | 'balanced' | 'quality'
