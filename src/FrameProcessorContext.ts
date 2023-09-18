let workletRuntime = null
let createWorklet = () => {
  throw new Error("Reanimated V3 is not installed, Frame Processors are not available!")
}

try {
  const reanimated = require('react-native-reanimated')
  if (reanimated.createWorkletRuntime == null) {
    console.warn("Frame Processors are disabled because you're using an incompatible version of Reanimated.")
  }
  workletRuntime = reanimated.createWorkletRuntime('VisionCamera')
  createWorklet = reanimated.makeShareableCloneRecursive
} catch {
  // Frame Processors are not enabled
}

export const FrameProcessorContext = {
  workletRuntime: workletRuntime,
  createWorklet: createWorklet
}
