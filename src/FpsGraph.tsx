import React, { useMemo } from 'react'
import type { ViewProps } from 'react-native'
import { StyleSheet, Text } from 'react-native'
import { View } from 'react-native'

interface Props extends ViewProps {
  /**
   * The current average FPS samples over time. One sample should be 1 second
   */
  averageFpsSamples: number[]
  /**
   * The target FPS rate
   */
  targetMaxFps: number
}

export const MAX_BARS = 30

const WIDTH = 100
const HEIGHT = 65
const BAR_WIDTH = WIDTH / MAX_BARS

export function FpsGraph({ averageFpsSamples, targetMaxFps, style, ...props }: Props): React.ReactElement {
  const maxFps = useMemo(() => {
    const currentMaxFps = averageFpsSamples.reduce((prev, curr) => Math.max(prev, curr), 0)
    return Math.max(currentMaxFps, targetMaxFps)
  }, [averageFpsSamples, targetMaxFps])
  const latestFps = averageFpsSamples[averageFpsSamples.length - 1]

  return (
    <View {...props} style={[styles.container, style]}>
      {averageFpsSamples.map((fps, index) => {
        let height = (fps / maxFps) * HEIGHT
        if (Number.isNaN(height) || height < 0) {
          // clamp to 0 if needed
          height = 0
        }
        return <View key={index} style={[styles.bar, { height: height }]} />
      })}
      {latestFps != null && !Number.isNaN(latestFps) && (
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    borderRadius: 5,
    overflow: 'hidden',
  },
  bar: {
    width: BAR_WIDTH,
    height: 5,
    backgroundColor: 'rgb(243, 74, 77)',
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    position: 'absolute',
    fontWeight: 'bold',
    fontSize: 14,
    color: 'rgb(255, 255, 255)',
  },
})
