import type { CameraController } from '../CameraController.nitro'
import type { CameraDevice } from '../inputs/CameraDevice.nitro'

/**
 * Represents the auto-focus algorithm used by the {@linkcode CameraDevice}, either while
 * continuously keeping a scene in focus (via auto-3A / AE/AF/AWB), or for a metering
 * action via {@linkcode CameraController.focusTo | CameraController.focusTo(...)}.
 *
 * - `'none'`: The {@linkcode CameraDevice} does not support auto-focus at all.
 * - `'contrast-detection'`: Finds focus by adjusting the lens until image contrast is highest.
 *   Commonly supported, but generally slower than phase-detection.
 * - `'phase-detection'`: Finds focus by using phase information to predict the correct lens position.
 *   Generally the fastest and most reliable auto-focus system when available.
 */
export type AutoFocusSystem = 'none' | 'contrast-detection' | 'phase-detection'
