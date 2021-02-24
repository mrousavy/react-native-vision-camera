<table>
<tr>
<th><a href="../README.md">README</a></th>
<th><a href="./SETUP.md">SETUP</a></th>
<th><a href="./DEVICES.md">DEVICES</a></th>
<th><a href="./FORMATS.md">FORMATS</a></th>
<th><a href="./FRAME_PROCESSORS.md">FRAME_PROCESSORS</a></th>
<th>ANIMATED</th>
<th><a href="./ERRORS.md">ERRORS</a></th>
</tr>
</table>

<br/>

<h1 align="center">Animated</h1>

<div>
  <img align="right" width="35%" src="../img/ultra-wide-demo.gif">
</div>

## Animations

Often you'd want to animate specific props in the Camera. For example, if you'd want to create a custom zoom gesture, you can smoothly animate the Camera's `zoom` property.

The following example uses [react-native-reanimated](https://github.com/software-mansion/react-native-reanimated) (v2) to animate the `zoom` property:


```tsx
import Reanimated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)
Reanimated.addWhitelistedNativeProps({
  zoom: true,
})

export function App() {
  const zoom = useSharedValue(0)

  const onRandomZoomPress = useCallback(() => {
    zoom.value = withSpring(Math.random())
  }, [])

  const animatedProps = useAnimatedProps<Partial<CameraProps>>(
    () => ({ zoom: zoom.value }),
    [zoom]
  )

  return (
    <>
      <ReanimatedCamera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        animatedProps={animatedProps}
      />
      <TouchableOpacity
        style={styles.zoomButton}
        onPress={onRandomZoomPress}>
        <Text>Zoom randomly!</Text>
      </TouchableOpacity>
    </>
  )
}
```

### Implementation

1. The `Camera` is converted to a reanimated Camera using `Reanimated.createAnimatedComponent`
2. The `zoom` property is added to the whitelisted native props to make it animatable.
    > Note that this might not be needed in the future, see: [reanimated#1409](https://github.com/software-mansion/react-native-reanimated/pull/1409)
3. Using [`useSharedValue`](https://docs.swmansion.com/react-native-reanimated/docs/api/useSharedValue), we're creating a shared value that holds the `zoom` property.
4. Using the [`useAnimatedProps`](https://docs.swmansion.com/react-native-reanimated/docs/api/useAnimatedProps) hook, we apply the shared value to the animated props.
5. We apply the animated props to the `ReanimatedCamera` component's `animatedProps` property.


<br />

#### 🚀 Next section: [ERRORS](./ERRORS.md)
