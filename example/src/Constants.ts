import { Dimensions, Platform } from "react-native";
import StaticSafeAreaInsets from "react-native-static-safe-area-insets";

export const CONTENT_SPACING = 15;

export const SAFE_AREA_PADDING = {
  paddingLeft: StaticSafeAreaInsets.safeAreaInsetsLeft + CONTENT_SPACING,
  paddingTop: StaticSafeAreaInsets.safeAreaInsetsTop + CONTENT_SPACING,
  paddingRight: StaticSafeAreaInsets.safeAreaInsetsRight + CONTENT_SPACING,
  paddingBottom: StaticSafeAreaInsets.safeAreaInsetsBottom + CONTENT_SPACING
}

// whether to use takeSnapshot() instead of takePhoto() on Android
export const USE_SNAPSHOT_ON_ANDROID = false;

// The maximum photo resolution (in pixels).
// Setting this to a lower value means faster capture speed
// Setting this to a higher value means higher quality images
export const RESOLUTION_LIMIT = Platform.select({
  android: 3264 * 1840,
});

// whether to use ultra-wide-angle cameras if available, or explicitly disable them. I think ultra-wide-angle cams don't support 60FPS...
export const USE_ULTRAWIDE_IF_AVAILABLE = true;

// the max FPS to use if available
export const HIGH_FPS = 50;

// The maximum zoom _factor_ you should be able to zoom in
export const MAX_ZOOM_FACTOR = 16;

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Platform.select<number>({
  android: Dimensions.get("screen").height - StaticSafeAreaInsets.safeAreaInsetsBottom,
  ios: Dimensions.get("window").height,
}) as number;
