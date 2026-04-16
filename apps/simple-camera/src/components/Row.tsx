import type React from 'react'
import { StyleSheet, View, type ViewProps } from 'react-native'

export function Row({ style, ...props }: ViewProps): React.ReactElement {
  return <View style={[styles.row, style]} {...props} />
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 15,
  },
})
