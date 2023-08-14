import { ConfigPlugin } from '@expo/config-plugins';
/**
 * Set the `disableFrameProcessors` inside of the XcodeProject.
 * This is used to disable frame processors if you don't need it on iOS. (will save CPU and Memory)
 */
export declare const withDisableFrameProcessorsIOS: ConfigPlugin;
