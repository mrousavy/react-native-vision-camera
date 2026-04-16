import type { HybridObject } from 'react-native-nitro-modules'
import type { Frame } from './instances/Frame.nitro'
import type { FrameRendererView } from './views/FrameRendererView.nitro'

/**
 * A {@linkcode FrameRenderer} is an object that can
 * render {@linkcode Frame}s into a given target.
 *
 * For example, when a {@linkcode FrameRendererView} is
 * connected to a {@linkcode FrameRenderer}, it renders
 * its {@linkcode Frame}s on screen.
 *
 * You could also build a custom video recorder that
 * accepts {@linkcode Frame}s via a {@linkcode FrameRenderer}.
 */
export interface FrameRenderer
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Synchronously renders the given {@linkcode Frame}.
   */
  renderFrame(frame: Frame): void
}
