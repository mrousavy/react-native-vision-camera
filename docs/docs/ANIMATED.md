---
id: animated
title: Zooming with Reanimated
sidebar_label: Zooming with Reanimated
---

<div>
  <img align="right" width="35%" src="./img/ultra-wide-demo.gif" />
</div>

## Animations

Often you'd want to animate specific props in the Camera. For example, if you'd want to create a custom zoom gesture, you can smoothly animate the Camera's `zoom` property.

:::note
The `<Camera>` component does provide a natively implemented zoom gesture which you can enable with the `enableZoomGesture={true}` prop.

This does not require any additional work, but if you want to setup a custom gesture, such as the one in Snapchat or Instagram where you move up your finger while recording, continue reading.
:::

### Installing reanimated

The following example uses [react-native-reanimated](https://github.com/software-mansion/react-native-reanimated) (v2) to animate the `zoom` property. Head over to their [Installation guide](https://docs.swmansion.com/react-native-reanimated/docs/installation) to install Reanimated if you haven't already.

### Implementation

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
  const devices = useCameraDevices()
  const device = devices.back
  const zoom = useSharedValue(0)

  const onRandomZoomPress = useCallback(() => {
    zoom.value = withSpring(Math.random())
  }, [])

  const animatedProps = useAnimatedProps<Partial<CameraProps>>(
    () => ({ zoom: zoom.value }),
    [zoom]
  )

  if (device == null) return <LoadingView />
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

#### 🚀 Next section: [Camera Errors](errors)
