"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _configPlugins = require("@expo/config-plugins");
var _withEnableFrameProcessorsAndroid = require("./withEnableFrameProcessorsAndroid");
var _withEnableFrameProcessorsIOS = require("./withEnableFrameProcessorsIOS");
var _withAndroidMLKitVisionModel = require("./withAndroidMLKitVisionModel");
var _withEnableLocationIOS = require("./withEnableLocationIOS");
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const pkg = require('../../../package.json');
const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const LOCATION_USAGE = 'Allow $(PRODUCT_NAME) to access your location';
const withCamera = (config, props = {}) => {
  if (config.ios == null) config.ios = {};
  if (config.ios.infoPlist == null) config.ios.infoPlist = {};
  // Camera permission
  config.ios.infoPlist.NSCameraUsageDescription = props.cameraPermissionText ?? config.ios.infoPlist.NSCameraUsageDescription ?? CAMERA_USAGE;
  if (props.enableMicrophonePermission) {
    // Microphone permission
    config.ios.infoPlist.NSMicrophoneUsageDescription = props.microphonePermissionText ?? config.ios.infoPlist.NSMicrophoneUsageDescription ?? MICROPHONE_USAGE;
  }
  if (props.enableLocation) {
    // Location permission
    config.ios.infoPlist.NSLocationWhenInUseUsageDescription = props.locationPermissionText ?? config.ios.infoPlist.NSLocationWhenInUseUsageDescription ?? LOCATION_USAGE;
  }
  const androidPermissions = ['android.permission.CAMERA'];
  if (props.enableMicrophonePermission) androidPermissions.push('android.permission.RECORD_AUDIO');
  if (props.enableLocation) androidPermissions.push('android.permission.ACCESS_FINE_LOCATION');
  if (props.enableLocation != null) {
    // set Podfile property to build location-related stuff
    config = (0, _withEnableLocationIOS.withEnableLocationIOS)(config, props.enableLocation);
  }
  if (props.enableFrameProcessors != null) {
    // set Podfile property to build frame-processor-related stuff
    config = (0, _withEnableFrameProcessorsAndroid.withEnableFrameProcessorsAndroid)(config, props.enableFrameProcessors);
    config = (0, _withEnableFrameProcessorsIOS.withEnableFrameProcessorsIOS)(config, props.enableFrameProcessors);
  }
  if (props.enableCodeScanner) config = (0, _withAndroidMLKitVisionModel.withAndroidMLKitVisionModel)(config, props);
  return (0, _configPlugins.withPlugins)(config, [[_configPlugins.AndroidConfig.Permissions.withPermissions, androidPermissions]]);
};
var _default = exports.default = (0, _configPlugins.createRunOncePlugin)(withCamera, pkg.name, pkg.version);
//# sourceMappingURL=withVisionCamera.js.map