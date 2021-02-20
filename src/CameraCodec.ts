/**
 * Available Video Codec types used for recording a video.
 *
 * * `"hevc"`: The HEVC video codec. _(iOS 11.0+)_
 * * `"h264"`: The H.264 (`avc1`) video codec. _(iOS 11.0+)_
 * * `"jpeg"`: The JPEG (`jpeg`) video codec. _(iOS 11.0+)_
 * * `"pro-res-4444"`: The Apple ProRes 4444 (`ap4h`) video codec. _(iOS 11.0+)_
 * * `"pro-res-422"`: The Apple ProRes 422 (`apcn`) video codec. _(iOS 11.0+)_
 * * `"pro-res-422-hq"`: The Apple ProRes 422 HQ (`apch`) video codec. _(iOS 13.0+)_
 * * `"pro-res-422-lt"`: The Apple ProRes 422 LT (`apcs`) video codec. _(iOS 13.0+)_
 * * `"pro-res-422-proxy"`: The Apple ProRes 422 Proxy (`apco`) video codec. _(iOS 13.0+)_
 * * `"hevc-alpha"`: The HEVC (`muxa`) video codec that supports an alpha channel. This constant is used to select the appropriate encoder, but is NOT used on the encoded content, which is backwards compatible and hence uses `"hvc1"` as its codec type. _(iOS 13.0+)_
 */
export type CameraVideoCodec =
  | 'h264'
  | 'hevc'
  | 'hevc-alpha'
  | 'jpeg'
  | 'pro-res-4444'
  | 'pro-res-422'
  | 'pro-res-422-hq'
  | 'pro-res-422-lt'
  | 'pro-res-422-proxy';

// TODO: Support RAW photo codec
/**
 * Available Photo Codec types used for taking a photo.
 *
 * * `"hevc"`: The HEVC video codec. _(iOS 11.0+)_
 * * `"jpeg"`: The JPEG (`jpeg`) video codec. _(iOS 11.0+)_
 * * `"hevc-alpha"`: The HEVC (`muxa`) video codec that supports an alpha channel. This constant is used to select the appropriate encoder, but is NOT used on the encoded content, which is backwards compatible and hence uses `"hvc1"` as its codec type. _(iOS 13.0+)_
 */
export type CameraPhotoCodec = 'hevc' | 'jpeg' | 'hevc-alpha';
