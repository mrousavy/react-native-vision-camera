import type { ConfigPlugin } from '@expo/config-plugins';
/**
 * Set the `enableLocation` flag inside of the XcodeProject.
 * This is used to enable location APIs.
 * If location is disabled, the CLLocation APIs are not used in the codebase.
 * This is useful if you don't use Location and apple review is unhappy about CLLocation usage.
 */
export declare const withEnableLocationIOS: ConfigPlugin<boolean>;
//# sourceMappingURL=withEnableLocationIOS.d.ts.map