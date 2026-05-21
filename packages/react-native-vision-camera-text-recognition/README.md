# react-native-vision-camera-text-recognition

This is VisionCamera Text Recognition. Install it through npm:

```sh
npm install react-native-vision-camera-text-recognition
```

VisionCamera Text Recognition depends on VisionCamera Core.

```sh
# Make sure VisionCamera Core is installed.
```

Then, update your native project:

```sh
npx pod-install
```

And rebuild your app.

## Frame Processor

```ts
const recognizer = useTextRecognizer()

const frameOutput = useFrameOutput({
  onFrame(frame) {
    'worklet'
    const result = recognizer.recognizeText(frame)
    console.log(result.text)
    frame.dispose()
  },
})
```

## Camera Output

```tsx
const output = useTextRecognitionOutput({
  onTextRecognized(result) {
    console.log(result.text)
  },
  onError(error) {
    console.error(error)
  },
})

return <Camera isActive={true} device={device} outputs={[output]} />
```

## Ready-made Camera View

```tsx
return (
  <TextRecognitionCamera
    style={{ flex: 1 }}
    isActive={true}
    onTextRecognized={(result) => console.log(result.text)}
    onError={(error) => console.error(error)}
  />
)
```
