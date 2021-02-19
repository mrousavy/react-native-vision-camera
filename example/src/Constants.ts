import StaticSafeAreaInsets from "react-native-static-safe-area-insets";

export const CONTENT_SPACING = 15;

export const SAFE_AREA_PADDING = {
  paddingLeft: StaticSafeAreaInsets.safeAreaInsetsLeft + CONTENT_SPACING,
  paddingTop: StaticSafeAreaInsets.safeAreaInsetsTop + CONTENT_SPACING,
  paddingRight: StaticSafeAreaInsets.safeAreaInsetsRight + CONTENT_SPACING,
  paddingBottom: StaticSafeAreaInsets.safeAreaInsetsBottom + CONTENT_SPACING
}
