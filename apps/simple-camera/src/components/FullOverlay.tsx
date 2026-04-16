import type React from 'react'
import { StyleSheet, View, type ViewProps } from 'react-native'

export function FullOverlay({
  style,
  ...props
}: ViewProps): React.ReactElement {
  return <View style={[styles.overlay, style]} {...props} />
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    marginTop: 15,
    marginBottom: 25,
  },
})
