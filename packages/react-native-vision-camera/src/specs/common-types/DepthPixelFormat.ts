/**
 * Represents the pixel format of a depth image buffer.
 *
 * In general, `depth-*` formats use actual depth sensors (like
 * infra-red, time-of-flight or LiDAR), whereas `disparity-*`
 * formats come from multiple constituent physical cameras
 * and represents pixel shift between two or more cameras.
 *
 * | Format                     | Domain     | Sample                           | Storage             | Layout       |
 * |----------------------------|------------|----------------------------------|---------------------|--------------|
 * | `depth-16-bit`             | Depth      | `[depth]`                        | Platform 16-bit     | Single-plane |
 * | `depth-32-bit`             | Depth      | `[depth]`                        | 32-bit Float        | Single-plane |
 * | `depth-point-cloud-32-bit` | PointCloud | `[x, y, z, confidence]`          | 32-bit Float        | Interleaved  |
 * | `disparity-16-bit`         | Disparity  | `[disparity]`                    | 16-bit Float        | Single-plane |
 * | `disparity-32-bit`         | Disparity  | `[disparity]`                    | 32-bit Float        | Single-plane |
 * | `unknown`                  | —          | —                                | —                   | —            |
 *
 * @note On iOS, `depth-16-bit` maps to `kCVPixelFormatType_DepthFloat16`
 * and stores one 16-bit float depth sample in meters. On Android,
 * `depth-16-bit` maps to `ImageFormat.DEPTH16`, where each 16-bit sample
 * stores 13 bits of range in millimeters plus 3 bits of confidence.
 */
export type DepthPixelFormat =
  | 'depth-16-bit'
  | 'depth-32-bit'
  | 'depth-point-cloud-32-bit'
  | 'disparity-16-bit'
  | 'disparity-32-bit'
  | 'unknown'
