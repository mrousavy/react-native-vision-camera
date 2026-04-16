/**
 * Represents the pixel format of a depth image buffer.
 *
 * In general, `depth-*` formats use actual depth sensors (like
 * infra-red, time-of-flight or LiDAR), whereas `disparity-*`
 * formats come from multiple constituent physical cameras
 * and represents pixel shift between two or more cameras.
 *
 * | Format                     | Domain     | Sample                           | Bit depth     | Layout       |
 * |----------------------------|------------|----------------------------------|---------------|--------------|
 * | `depth-16-bit`             | Depth      | `[depth]`                        | 16-bit Float  | Planar       |
 * | `depth-32-bit`             | Depth      | `[depth]`                        | 32-bit Float  | Planar       |
 * | `depth-point-cloud-32-bit` | PointCloud | `[x, y, z, confidence]`          | 32-bit Float  | Interleaved  |
 * | `disparity-16-bit`         | Disparity  | `[disparity]`                    | 16-bit Float  | Planar       |
 * | `disparity-32-bit`         | Disparity  | `[disparity]`                    | 32-bit Float  | Planar       |
 * | `unknown`                  | —          | —                                | —             | —            |
 */
export type DepthPixelFormat =
  | 'depth-16-bit'
  | 'depth-32-bit'
  | 'depth-point-cloud-32-bit'
  | 'disparity-16-bit'
  | 'disparity-32-bit'
  | 'unknown'
