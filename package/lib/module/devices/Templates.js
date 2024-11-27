import { Dimensions } from 'react-native';
const SnapchatResolution = {
  width: 1920,
  height: 1080
};
const InstagramResolution = {
  width: 3840,
  height: 2160
};
const ScreenAspectRatio = Dimensions.get('window').height / Dimensions.get('window').width;

/**
 * Predefined templates for use in `useCameraFormat`/`getCameraFormat`.
 * @example
 * ```ts
 * const format = useCameraFormat(device, Templates.Snapchat)
 * ```
 */
export const Templates = {
  /**
   * Highest resolution video recordings (e.g. 4k)
   */
  Video: [{
    videoResolution: 'max'
  }],
  /**
   * High resolution 60 FPS video recordings (e.g. 1080@60 FPS)
   */
  Video60Fps: [{
    fps: 60
  }, {
    videoResolution: 'max'
  }],
  /**
   * High-FPS video recordings (e.g. 720@240 FPS)
   */
  VideoSlowMotion: [{
    fps: 240
  }, {
    videoResolution: 'max'
  }],
  /**
   * High resolution video recordings with cinematic video stabilization
   */
  VideoStabilized: [{
    videoResolution: 'max'
  }, {
    videoStabilizationMode: 'cinematic-extended'
  }],
  /**
   * Highest resolution photo capture (e.g. 4k)
   */
  Photo: [{
    photoResolution: 'max'
  }],
  /**
   * Highest resolution photo capture with portrait screen aspect ratio (e.g. 4k)
   */
  PhotoPortrait: [{
    photoResolution: 'max'
  }, {
    photoAspectRatio: ScreenAspectRatio
  }],
  /**
   * HD-quality for faster Frame Processing (e.g. 720p)
   */
  FrameProcessing: [{
    videoResolution: {
      width: 1080,
      height: 720
    }
  }],
  /**
   * Snapchat-style video recordings and photo capture
   * Targets Full HD-quality for lower file sizes and portrait screen aspect ratio.
   */
  Snapchat: [{
    videoAspectRatio: ScreenAspectRatio
  }, {
    videoResolution: SnapchatResolution
  }, {
    photoAspectRatio: ScreenAspectRatio
  }, {
    photoResolution: SnapchatResolution
  }],
  /**
   * Instagram-style video recordings and photo capture.
   * Targets 4k-quality and portrait screen aspect ratio.
   */
  Instagram: [{
    videoAspectRatio: ScreenAspectRatio
  }, {
    videoResolution: InstagramResolution
  }, {
    photoAspectRatio: ScreenAspectRatio
  }, {
    photoResolution: InstagramResolution
  }]
};
//# sourceMappingURL=Templates.js.map