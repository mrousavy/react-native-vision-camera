import type { Orientation } from './types/Orientation';
export declare class RotationHelper {
    /**
     * Gets or sets the current preview orientation.
     */
    previewOrientation: Orientation;
    /**
     * Gets or sets the current output orientation.
     */
    outputOrientation: Orientation;
    /**
     * Gets the current target rotation (in degrees) that needs to be applied
     * to all UI elements so they appear up-right.
     */
    get uiRotation(): number;
}
//# sourceMappingURL=RotationHelper.d.ts.map