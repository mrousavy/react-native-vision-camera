import { BlurView, BlurViewProperties } from '@react-native-community/blur';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import StaticSafeAreaInsets from 'react-native-static-safe-area-insets';

const FALLBACK_COLOR = 'rgba(140, 140, 140, 0.3)';

const StatusBarBlurBackgroundImpl = ({ style, ...props }: BlurViewProperties): React.ReactElement | null => {
  if (Platform.OS !== 'ios') return null;

  return (
    <BlurView
      style={[styles.statusBarBackground, style]}
      blurAmount={25}
      blurType="light"
      reducedTransparencyFallbackColor={FALLBACK_COLOR}
      {...props}
    />
  );
};

export const StatusBarBlurBackground = React.memo(StatusBarBlurBackgroundImpl);

const styles = StyleSheet.create({
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StaticSafeAreaInsets.safeAreaInsetsTop,
  },
});
