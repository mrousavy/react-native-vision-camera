import { BlurView } from '@react-native-community/blur'
import type React from 'react'
import { Platform, StyleSheet, View, type ViewProps } from 'react-native'

export interface BlurContainerProps extends ViewProps {
  tint?: 'dark' | 'light'
}

export function BlurContainer({
  tint = 'dark',
  style,
  children,
  ...props
}: BlurContainerProps): React.ReactElement {
  if (Platform.OS === 'ios') {
    return (
      <View style={style} {...props}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurRadius={15}
          blurAmount={15}
          blurType={tint}
        />
        {children}
      </View>
    )
  } else {
    const bgStyle = tint === 'dark' ? styles.dark : styles.light
    return (
      <View style={[bgStyle, style]} {...props}>
        {children}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  dark: {
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  light: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
})
