import { VisionCamera } from './VisionCamera'

// TODO: We need to expose more from VisionCamera and also copy over the docs, but `VisionCamera` sounds super internal...

export const createNormalizedMeteringPoint: (typeof VisionCamera)['createNormalizedMeteringPoint'] =
  VisionCamera.createNormalizedMeteringPoint.bind(VisionCamera)
