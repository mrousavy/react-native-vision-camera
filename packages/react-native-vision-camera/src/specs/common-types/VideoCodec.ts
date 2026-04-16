/**
 * Represents a video codec for encoded video data.
 * | Identifier          | Chroma      | Bit Depth | Type        | Alpha | Notes                                        |
 * |---------------------|-------------|-----------|-------------|-------|----------------------------------------------|
 * | `h264`              | 4:2:0/2:2   | 8-bit     | AVC         | No    | Most widely supported video format.          |
 * | `h265`              | 4:2:0/4:2:2 | 8/10-bit  | HEVC        | No    | Higher efficiency than H.264.                |
 * | `h265-with-alpha`   | 4:4:4       | 10-bit    | HEVC        | Yes   | Used for rendered content with transparency. |
 * | `pro-res-422-proxy` | 4:2:2       | 10-bit    | ProRes      | No    | Lowest bitrate; proxy workflows.             |
 * | `pro-res-422-lt`    | 4:2:2       | 10-bit    | ProRes      | No    | Reduced bitrate version of 422.              |
 * | `pro-res-422`       | 4:2:2       | 10-bit    | ProRes      | No    | Standard 422 quality.                        |
 * | `pro-res-422-hq`    | 4:2:2       | 10-bit    | ProRes      | No    | Highest-quality 422 variant.                 |
 * | `pro-res-4444`      | 4:4:4       | 12-bit    | ProRes      | Yes   | Full chroma + optional alpha.                |
 * | `pro-res-4444-xq`   | 4:4:4       | 12-bit    | ProRes      | Yes   | Highest-bitrate non-RAW ProRes.              |
 * | `pro-res-422`       | RAW         | 12-bit    | ProRes RAW  | N/A   | Compressed Bayer RAW.                        |
 * | `pro-res-422-hq`    | RAW         | 12-bit    | ProRes RAW  | N/A   | Higher-quality ProRes RAW.                   |
 * | `jpeg`              | 4:2:2       | 8-bit     | JPEG/MJPEG  | No    | Legacy motion JPEG; Not very efficient.      |
 * | `unknown`           | N/A         | N/A       | unknown     | N/A   | An unknown codec - it cannot be used.        |
 */
export type VideoCodec =
  | 'h264'
  | 'h265'
  | 'h265-with-alpha'
  | 'pro-res-422-proxy'
  | 'pro-res-422-lt'
  | 'pro-res-422'
  | 'pro-res-422-hq'
  | 'pro-res-4444'
  | 'pro-res-4444-xq'
  | 'pro-res-raw'
  | 'pro-res-raw-hq'
  | 'jpeg'
  | 'unknown'
