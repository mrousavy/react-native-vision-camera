import React, { useMemo } from 'react'
import type { ViewProps } from 'react-native'
import { StyleSheet, Text } from 'react-native'
import { View } from 'react-native'

interface Props extends ViewProps {
  averageFpsSamples: number[]
}

export const MAX_BARS = 30

const WIDTH = 100
const HEIGHT = 65
const BAR_WIDTH = WIDTH / MAX_BARS

export function FpsGraph({ averageFpsSamples, style, ...props }: Props): React.ReactElement {
  const maxFps = useMemo(() => averageFpsSamples.reduce((prev, curr) => Math.max(prev, curr), 0), [averageFpsSamples])
  const latestFps = averageFpsSamples[averageFpsSamples.length - 1]

  return (
    <View {...props} style={[styles.container, style]}>
      {averageFpsSamples.map((fps, index) => (
        <View key={index} style={[styles.bar, { height: (fps / maxFps) * HEIGHT }]} />
      ))}
      {latestFps != null && (
        <View style={styles.centerContainer}>
          <Text style={styles.text}>{Math.round(latestFps)} FPS</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: 'black',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  bar: {
    width: BAR_WIDTH,
    height: 5,
    backgroundColor: 'red',
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    position: 'absolute',
    fontWeight: 'bold',
    color: 'white',
  },
})
